import { prisma } from "@/src/lib/prisma/client";
import { createSchoolAndAdminSchema } from "@/src/validators/schoolSchema";
import { NextRequest, NextResponse } from "next/server";
import { generateSetUpToken, setUpTempPasswordForAdmin } from "../notification/services";
import { hashPassword } from "@/src/lib/auth/hash";

export const createSchoolAndAdmin = async(req: NextRequest, userId: string | undefined) => {
    console.log('Super admin wants to create school');
    const body = await req.json()
    const parsedBody = createSchoolAndAdminSchema.safeParse(body); //reads the form inputs sent from the client and parses it
    if(!parsedBody.success) {
        return NextResponse.json(
            { error: "Input validation failed"},
            { status: 400}
        )
    }
    const { school: schoolData, admin: adminData } = parsedBody.data
    const existingSchoolName = await prisma.school.findFirst(
        {
            where: 
            { 
                name: 
                {
                    equals: schoolData.name,
                    mode: "insensitive"
                },
            },
            select: { id: true }
        }
    )
    if(existingSchoolName){
        return NextResponse.json(
            { error: `A school named ${schoolData.name} already exists.`},
            { status: 409 }
        )
    }
    if(adminData){
        const emailTaken = await prisma.user.findUnique( //matches email of the admin created to existing emails in the database
            { 
                where: { email: adminData.email },
                select: { id: true }
            },
        )
        if(emailTaken){ //checks if email already exist
            return NextResponse.json(
                { error: `$Email: ${adminData.email} is already registered!`},
                { status: 409}
            )
        }
    }
    const superAdminProfile = await prisma.user.findUnique(
        { where: { id: userId  }, select: {id: true} }
    )
    const created = await prisma.$transaction(
        async(tx) => {
            const school = await tx.school.create(
                {
                    data: {
                        name: schoolData.name,
                        address: schoolData.address,
                        phone: schoolData.phone,
                        logoUrl: schoolData.logoUrl,
                        email: schoolData.email,
                        isActive: true,
                        ...(superAdminProfile
                            ? { createdById: superAdminProfile.id }
                            : {}
                        )
                    }
                }
            )
            if(!adminData) {
                return { school, admin: null }
            }
            // admin creation if admin data is provided on school creation
            let temporaryPassword: string | undefined;
            let rawSetUpToken: string | undefined

            temporaryPassword = setUpTempPasswordForAdmin(); //generates a temporary password
            const hashedTemporaryPassword = await hashPassword(temporaryPassword) //hashes the temporary password with the bcrypt helper function
            rawSetUpToken = generateSetUpToken().raw

            const admin = await tx.user.create({
                data: {
                    email: adminData.email,
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    role: "ADMIN",
                    schoolId: school.id,
                    password: hashedTemporaryPassword,
                    status: "PENDING",
                    mustChangePassword: true,
                    isActive: true,
                    passwordHash: hashedTemporaryPassword
                },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    status: true, schoolId: true, createdAt: true
                }
            });

            await prisma.token.create({
                data: {
                    userId: admin.id,
                    tokenHash: generateSetUpToken().hash,
                    type: "SET_UP",
                    expiresAt: ""
                }
            })

            return { school, admin };
        }
    )
    return NextResponse.json(
        { message: "School created", data: created },
        { status: 201 }
    )
}