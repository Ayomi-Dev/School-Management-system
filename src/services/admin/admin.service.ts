import { AdminCreateUserInput, adminCreateUserSchema } from "@/src/validators/adminSchema";
import { prisma } from "@/src/lib/prisma/client";
import{ NextRequest, NextResponse } from "next/server"
import { buildUserPayload } from "@/src/utils/userPayloadBuilder";
import { generateUserCode } from "../userCode";
import { generalTempPassword, generateSetUpToken } from "../notification/services";
import { hashPassword } from "@/src/lib/auth/hash";


export const adminServices = {
    //creates a new user (teacher, student, or parent) under the admin's school with a temporary password and a unique user code. The user will receive an email with the temporary password and a set-up token to complete their account setup.
    async provisionUser(req: NextRequest, schoolId: string ) {
        try{

            const body = await req.json()
            const parsedBody = adminCreateUserSchema.safeParse(body)
            if (!parsedBody.success) {
                return NextResponse.json(
                    {
                        error: "Validation failed",
                        details: parsedBody.error.flatten().fieldErrors,
                    },
                    { status: 400 }
                );
            }
    
            const userInput = parsedBody.data
            const existingUser = await prisma.user.findUnique(
                {
                    where: { email: userInput.email, phone: userInput.phone },
                    select: { id: true}
                }
            );
            if(existingUser){
                return NextResponse.json(
                    { error: "A user with this email/phone already exists" }, 
                    { status: 409 }
                )
            }
            let tempPassword: string | undefined;
            let rawSetUpToken: string | undefined;
            tempPassword = generalTempPassword(userInput.lastName)
            const passwordHash = await hashPassword(tempPassword)
            const { raw, hash } = generateSetUpToken();
            rawSetUpToken = raw;
            const userCode = await generateUserCode(userInput.role, schoolId )
            const userPayload = buildUserPayload(userInput, {schoolId, userCode}, passwordHash)
    
            const newUser = await prisma.$transaction(
                async(tx) => {
                    const newUser = await tx.user.create(
                        {
                            data: userPayload,
                            select: {
                                id:        true,
                                email:     true,
                                firstName: true,
                                lastName:  true,
                                role:      true,
                                status:    true,
                                createdAt: true,  
                            }
                       },
            
                    )
    
                    await tx.token.create(
                        {
                            data: {
                                userId: newUser.id,
                                tokenHash: hash,
                                type: "SET_UP",
                                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
                            }
                        }
                    )
    
                    return newUser
                }
                
            )
            return NextResponse.json(
                {
                    message: "User provisioned successfully",
                    user: newUser,
                }
            )
        }
        catch(error){
            console.error("Error provisioning user:", error);
            return NextResponse.json(
                { error: "An unexpected error occurred while provisioning the user" },
                { status: 500 }
            )
        }
   }
}