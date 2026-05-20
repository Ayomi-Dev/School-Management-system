import { prisma } from "@/src/lib/prisma/client";
import bcrypt from "bcrypt"
import { NextResponse, NextRequest } from "next/server";
import {changePasswordSchema, forgotPasswordSchema, resetPasswordSchema} from "@/src/validators/passwordShema";
import { generateSetUpToken } from "../notification/services";
import { hashToken } from "@/src/lib/auth/hash";


const SALT_ROUNDS = 12; //controls how many times bcrypt processes user's password
export const passwordServices = {
    async hashPassword(password: string): Promise<string> {
        //Takes the plain-text password and runs it through bcrypt's hashing algorithm 2¹² (4,096) times
        //adding the salt automatically to make it unique and resistant to rainbow table attacks.
        return bcrypt.hash(password, SALT_ROUNDS) 
    },
    
    async  verifyPassword( 
        password: string, hashedPassword: string
    ): Promise<boolean> {
        // Takes a plain-text password and a stored hash, re-hashes the plain password using the same salt embedded inside the hash, 
        // then compares the two. Returns true if they match, false if not.
        return bcrypt.compare(password, hashedPassword) 
    },
    /**
 * Generates a temporary password the admin never sees after creation.
 * Format: 3 words + 4-digit number, e.g. "amber-fox-7291"
 * Easy to read aloud/type but hard to guess.
 */
  setUpTempPasswordForAdmin(): string {
    const adjectives = ["amber", "brave", "calm", "deep", "eager", "fair", "gold", "high", "iron", "jade"];
    const nouns      = ["crane", "delta", "eagle", "flame", "grove", "heron", "ivory", "lark",  "maple", "north"];
    const rand       = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const digits     = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
    return `${rand(adjectives)}-${rand(nouns)}-${digits}`;
    },

    generalTempPassword (lastName: string): string  { //uses user's surname as the temporaty password 
        return lastName;
    }, 
    async changePassowrd(req: NextRequest, userId: string) {
        const body = await req.json();
        const parsedBody = changePasswordSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsedBody.error.flatten().fieldErrors,
                },
                { status: 400 }
            )
        }
        const {currentPassword, newPassword } = parsedBody.data;
        const user = await prisma.user.findUnique(
            {
                where: {id: userId},
                select: { passwordHash: true}
            }
        )
        if(!user || !user.passwordHash){
            return NextResponse.json(
                { error: "User not found or has no password set."},
                { status: 404 }
            )
        }
        const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
        if(!isCurrentPasswordValid){
            return NextResponse.json(
                { error: "Current password is incorrect."},
                { status: 401 }
            )
        }

        const newHashedPassword = await this.hashPassword(newPassword);
        await prisma.$transaction(
            async(tx) => {
                await tx.user.update( // Update the user's passwordHash with the new hashed password in db
                    {
                        where: { id: userId },
                        data: { passwordHash: newHashedPassword }
                    }
                )

                // Revoke all existing password reset tokens for this user to prevent reuse of any previously issued tokens that might still be valid.
                await tx.token.updateMany(
                    {
                        where: { userId, type: "PASSWORD_RESET" },
                        data: { isRevoked: true }
                     }
                 ) 
             }
        )

        return NextResponse.json(
            { message: "Password reset successful. Kindly re-login with your new password." },
            { status: 200 }
        )
    },

    async forgotPassword(req: NextRequest) {
        // This function would handle the "forgot password" flow, which typically involves:
        // 1. Validating the user's email input.
        // 2. Generating a secure, single-use password reset token.
        // 3. Storing the token in the database with an expiration time.
        // 4. Sending an email to the user with a link containing the reset token.
        // 5. When the user clicks the link, they are taken to a password reset page where they can enter a new password.
        // 6. The server verifies the token, allows the user to set a new password, and then invalidates the token to prevent reuse.
        const body = await req.json();
        const parsedBody = forgotPasswordSchema.safeParse(body);
        if(!parsedBody.success){
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsedBody.error.flatten().fieldErrors,
                },
                { status: 400 }
            )  
        }
        const {userCode} = parsedBody.data;
        // Find the user by email or phone
        const user = await prisma.user.findUnique({
            where: {userCode},
            select: { id: true, email: true, phone: true }
        });
        if(!user){
            // To prevent user enumeration attacks, we return a generic message even if the user is not found.
            return NextResponse.json(
                { message: "If an account with that email or phone number exists, a password reset link has been sent." },
                { status: 200 }
            )
        }
        // Generate a secure token and store it in the database with an expiration time
        const {raw, hash} =  generateSetUpToken();
        await prisma.token.create({
            data: {
                userId: user.id,
                type: "PASSWORD_RESET",
                tokenHash: hash,
                expiresAt: new Date(Date.now() + 3600000) // Token expires in 1 hour
            }
        });
        // Send the password reset email with the raw token (which will be included in the reset link)
        // The email sending logic would go here, using your preferred email service provider.
        // The reset link would look something like: `https://yourapp.com/reset-password?token=${raw}`
        return NextResponse.json(
            { message: " A password reset link has been sent to your phone.", rawToken: raw },
            { status: 200 }
        )
    },

    async resetPassword(req: NextRequest) {
        try {
            const body = await req.json();
            const parsedBody = resetPasswordSchema.safeParse(body);
            if(!parsedBody.success){
                return NextResponse.json(
                    {
                        error: "Validation failed",
                        details: parsedBody.error.flatten().fieldErrors,
                    },
                    { status: 400 }
                )  
            }
            const { newPassword, token } = parsedBody.data;
            const passwordHash = await this.hashPassword(newPassword)
            const tokenHash = hashToken(token);
    
            // Find the token in the database and verify it
            const tokenRecord = await prisma.token.findFirst({
                where: { tokenHash, type: "PASSWORD_RESET" },
                select: { id: true, expiresAt: true, isRevoked: true, userId: true }
            });

            if(!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.isRevoked){ 
                return NextResponse.json(
                    { error: "Invalid or expired token"},
                    { status: 400 }
                )
            }   

            // Update the user's password and revoke the token in a single transaction to ensure atomicity
            await prisma.$transaction(
                async(tx) => {
                    await tx.user.update(
                        {
                            where: { id: tokenRecord.userId },
                            data: {
                                passwordHash
                            }
                        }
                    )
                    await tx.token.updateMany( //Revoke all password reset tokens for this user to prevent reuse of any previously issued tokens that might still be valid.
                        {
                            where: { id: tokenRecord.id, type: "PASSWORD_RESET"},
                            data: {
                               isRevoked: true
                            }
                        }
                    )
                }
    
            )
    
            return NextResponse.json(
                { message: "Password reset succesfully"},
                { status: 200 }
            )
            
        } 
        catch (error) {
           console.log("error resetting password:", error) 
           return NextResponse.json(
                { error: "Internal server erro"},
                { status: 500}
           )
        }

    }

}
