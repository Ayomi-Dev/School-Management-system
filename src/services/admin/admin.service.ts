import { adminCreateUserSchema, adminUpdateSchema } from "@/src/validators/adminSchema";
import { prisma } from "@/src/lib/prisma/client";
import{ NextRequest, NextResponse } from "next/server"
import { buildUserPayload } from "@/src/utils/userPayloadBuilder";
import { generateUserCode } from "../../utils/userCode";
import { generalTempPassword, generateSetUpToken } from "../notification/services";
import { passwordServices } from "../passwords/password.service";

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

            //get school id
            const idForSchool = await prisma.school.findFirst(
                {
                    where: { id: schoolId },
                    select: { id: true }
                }
            )
            if(!idForSchool) {
                return NextResponse.json(
                    { error: "School id is missing."},
                    { status: 400 }
                )
            }

            //checks for email uniqueness since only non-admin roles uses usercode
            if((userInput.role === "TEACHER" || userInput.role === "BURSAR") && !userInput.email ){
                return NextResponse.json(
                    { error: "Email is required for this role"},
                    { status: 422 }
                )
            }

            //checks if the user already exists or not
            if(userInput.email){
                const existingUser = await prisma.user.findFirst(
                    {
                        where: { email: userInput.email, schoolId },
                        select: { id: true}
                    }
                );
                if(existingUser){
                    return NextResponse.json(
                        { error: "A user with this email/phone already exists" }, 
                        { status: 409 }
                    )
                }
            }
            let tempPassword: string | undefined;
            let rawSetUpToken: string | undefined;
            tempPassword = generalTempPassword(userInput.lastName)
            const passwordHash = await passwordServices.hashPassword(tempPassword)
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
                                isActive: true
                            }
                        }
                    )
                    //persist hashed set-up token in the DB
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

                    //Create Enrollment record if the user created is a student
                    if(userInput.role === "STUDENT"){
                        await tx.enrollment.create({
                          data: {
                            studentId: newUser.id,
                            classId: userInput.classId,
                            academicYearId: userInput.academicYearId,
                            enrolledAt: new Date(),
                          },
                        });
                    }

                    return newUser
                }
                
            )

            //links existing student to a guardian
            if(userInput.role==="PARENT" && userInput.studentUserIds?.length){
                const guardian = await prisma.guardian.findUnique(
                    {
                        where: { id: newUser.id },
                        select: {id: true}
                    }
                )
                if(guardian){
                    const studentProfiles = await prisma.studentProfile.findMany(
                        {
                            where: { userId: { in: userInput.studentUserIds }},
                            select: { id: true },
                        }
                    )
                    if(studentProfiles.length) {
                        await prisma.guardianStudent.createMany(
                            { 
                                data: studentProfiles.map((student) => 
                                (
                                    { 
                                        guardianId: guardian.id, 
                                        studentId: student.id
                                    }
                                )),
                                
                            }
                        )
                    }
                }
            }
            return NextResponse.json(
                {
                    message: "User provisioned successfully",
                    user: newUser, token: rawSetUpToken
                }
            )
        }
        catch(error){
            console.error("Error provisioning user:", error); 
            return NextResponse.json(
                { error: `"An unexpected error occurred while provisioning the user" ${error}` },
                { status: 500 }
            )
        }
   },

   async updateUser(req: NextRequest, id: string){
        const body = await req.json()
        const parsedBody = adminUpdateSchema.safeParse(body)
        if(!parsedBody.success){
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsedBody.error.flatten().fieldErrors,
                },
                { status: 400 }
            )  
        }

        //check if user exists
        const user = await prisma.user.findUnique(
            {
                where: { id },
                select: { id: true }
            }
        )
        if(!user){
            return NextResponse.json(
                { error: "Sorry, no user with this ID found."},
                { status: 404 }
            )
        }


   }
}