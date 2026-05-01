import { prisma } from "@/src/lib/prisma/client";
import {  provisionAdminSchema, ProvisionAdminInput } from "@/src/validators/adminSchema";
import { generateSetUpToken, setUpTempPasswordForAdmin } from "../notification/services";
import { hashPassword } from "@/src/lib/auth/hash";
import { NextRequest, NextResponse } from "next/server";
import { error } from "console";
import { USER_SELECT } from "@/src/lib/prisma/fields";


export const createAdmin = async(req: NextRequest, id: string) => {
    console.log(`Super admin wants to create admin for school with id: ${id}`);
    try {
        
        const body = await req.json();
        const parsedBody = provisionAdminSchema.safeParse(body);
        if(!parsedBody.success){
            return NextResponse.json(
                { error: "Input validation failed", details: parsedBody.error.flatten().fieldErrors},
                { status: 400 }
            )
        }
        const { email, firstName, lastName, phone } = parsedBody.data as ProvisionAdminInput;
    
        const school = await prisma.school.findUnique({
            where: { id },
            select: { 
                id: true, 
                name: true, 
                isActive: true 
            }
        });
    
        if(!school?.isActive){
            return NextResponse.json(
                { error: `Cannot provision admin for ${school?.name ?? "school"}. The school is not active.`},
                { status: 400 }
            )
        }
    
        const emailTaken = await prisma.user.findUnique({
            where: { email },
            select: { id: true}
        })
    
        if(emailTaken){
            return NextResponse.json(
                { error: `Email: ${email} is already registered!`},
                { status: 409}
            )
        }
    
        const admin = await prisma.$transaction(
            async(tx) => {
                let temporaryPassword: string | undefined;
                let rawSetUpToken: string | undefined
                temporaryPassword = setUpTempPasswordForAdmin(); //generates a temporary password
                const hashedTemporaryPassword = await hashPassword(temporaryPassword) //hashes the temporary password with the bcrypt helper function
                const {raw, hash} = generateSetUpToken();
                rawSetUpToken = raw
                const expiresAt     = new Date(Date.now() + 48 * 60 * 60 * 1000); // token expires48 hours from the day of creation
                const userCode = `ADM/${Math.random().toString(36).substring(2, 8).toUpperCase()}`; // generates a random user code for the admin
    
                const admin = await tx.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        userCode,
                        phone,
                        role: "ADMIN",
                        schoolId: id,
                        passwordHash: hashedTemporaryPassword,
                        status: "PENDING",
                        mustChangePassword: true,
                        isActive: true, 
                    },
                    select: {...USER_SELECT, school: {select: { id: true}}}
                    
                });
                
                await tx.token.create({
                    data: {
                        userId: admin.id,
                        tokenHash: hash,
                        type: "SET_UP",
                        expiresAt
                    }
                })
            }
            
        )
        return NextResponse.json(
            {
              message: `Admin provisioned for ${school.name}. Onboarding email sent to ${email}.`,
              admin
            },
            { status: 201 }
        );
    } 
    catch (error) {
        console.error("Error creating admin:", error);
        return NextResponse.json(
            { error: "An error occurred while creating the admin." },
            { status: 500 }
        );
    }

}