import { prisma } from "@/src/lib/prisma/client";
import { createSchoolAndAdminSchema } from "@/src/validators/schoolSchema";
import { NextRequest, NextResponse } from "next/server";
import { generateSetUpToken, setUpTempPasswordForAdmin } from "../notification/services";
import { hashPassword } from "@/src/lib/auth/hash";
import { USER_SELECT } from "@/src/lib/prisma/fields";
import { provisionAdminSchema, ProvisionAdminInput } from "@/src/validators/adminSchema";
import { generateUserCode } from "../userCode";




export const superAdminServices = {

    //creates school and admin in one transaction. If any of the operations fail, the entire transaction will be rolled back to maintain data integrity. This ensures that either both the school and admin are created successfully, or neither is created if there's an error.
    async createSchoolAndAdmin (req: NextRequest, userId: string | undefined) {
        try {
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
                { where: {id: userId}, 
                  select: {id: true} 
                }
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
                        select: USER_SELECT
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
            
        } catch (error) {
            console.error("Error creating school and admin:", error);
            return NextResponse.json(
                { error: "An error occurred while creating the school and admin." },
                { status: 500 }
            )
        }
    },

    //retrieves all schools with pagination. It calculates the offset based on the current page and limit, and then uses Prisma's findMany method to fetch the schools from the database. The total count of schools is also retrieved to calculate the total number of pages for pagination.
    async getAllSchools(req: NextRequest) {
        const { searchParams } = new URL(req.url) //
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);// Parses the "page" and "limit" query parameters from the request URL. If they are not provided, it defaults to page 1 and limit 10.
        const offset = (page - 1) * limit;

        const [schools, total] = await prisma.$transaction(
            [
                prisma.school.findMany({
                    orderBy: { createdAt: "desc" },
                    skip: offset,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        createdAt: true,
                        _count: {
                            select: { users: true } // Includes the count of users associated with each school
                        },
                        users: {
                            where: { role: "ADMIN"},
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userCode: true,
                                status: true
                            }
                        }
                    }
                }),
                prisma.school.count() // Gets the total count of schools for pagination

            ]
        ) 
        return NextResponse.json({ schools, total, page, pages: Math.ceil(total / limit) });
    },
    
    async provisionAdmin(req: NextRequest, id: string) {
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
                    const hashTemporaryPassword = await hashPassword(temporaryPassword) //hashes the temporary password with the bcrypt helper function
                    const {raw, hash} = generateSetUpToken();
                    rawSetUpToken = raw
                    const expiresAt     = new Date(Date.now() + 48 * 60 * 60 * 1000); // token expires48 hours from the day of creation
                    const userCode = await generateUserCode("ADMIN", id) //generates a unique user code for the admin based on their role and school ID
                
                    const admin = await tx.user.create({
                        data: {
                            email,
                            firstName,
                            lastName,
                            userCode,
                            phone,
                            role: "ADMIN",
                            schoolId: id,
                            passwordHash: hashTemporaryPassword,
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
}