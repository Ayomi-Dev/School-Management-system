import { prisma } from "@/src/lib/prisma/client";
import { createSchoolAndAdminSchema } from "@/src/validators/schoolSchema";
import { NextRequest, NextResponse } from "next/server";

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
        }
    )

    return NextResponse.json(
        { message: "School created", data: created },
        { status: 201 }
    )
}