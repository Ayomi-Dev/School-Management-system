import { adminCreateUserSchema, adminUpdateSchema } from "@/src/validators/adminSchema";
import { prisma } from "@/src/lib/prisma/client";
import{ NextRequest, NextResponse } from "next/server"
import { buildUserPayload } from "@/src/utils/userPayloadBuilder";
import { currentSession, generateUserCode } from "../../utils/userCode";
import { generalTempPassword, generateSetUpToken } from "../notification/services";
import { passwordServices } from "../passwords/password.service";
import { resolveAcademicYear, resolveClass } from "@/src/utils/resolvers";
import { classService } from "../class/class.service";
import { _levelOrder } from "@/src/utils/levelOrder";

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
            
            const newUser = await prisma.$transaction(
                async(tx) => {
                    const userCode = await generateUserCode(tx, userInput.role, schoolId )
                    const userPayload = buildUserPayload(userInput, {schoolId, userCode}, passwordHash)
                    const newUser = await tx.user.create(
                        {
                            data: userPayload,
                            select: {
                                id:        true,
                                userCode: true,
                                firstName: true,
                                lastName:  true,
                                role:      true,
                                status:    true,
                                createdAt: true,
                                isActive: true,
                                mustChangePassword: true,
                                isEmailVerified: true,
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

                    // Create Enrollment record if the user created is a student
                    if(userInput.role === "STUDENT"){
                        const profile = await tx.studentProfile.findUnique({
                            where: { userId: newUser.id },
                            select: { id: true, level: true}
                        })
                        if(!profile){
                            throw new Error("No student record found for this user")
                        }

                        const classRecord = await classService.getOrCreate(tx, schoolId, userInput.level, profile.level, _levelOrder(profile.level))
                        const label = currentSession()
                        const yearId = await resolveAcademicYear(schoolId, label)
                        await tx.enrollment.create({
                          data: {
                            studentId: profile.id,
                            classId: classRecord.id,
                            academicYearId: yearId.id,
                            enrolledAt: new Date(),
                          },
                        });

                        // Link to parent guardian if parentUserId provided
                        if(userInput.parentUserId){
                            let parentGuardian = await tx.guardian.findUnique({
                                where: { userId: userInput.parentUserId },
                                select: { id: true, userId: true }
                            })

                            // If guardian record doesn't exist, create one from the user
                            if(!parentGuardian){
                                const parentUser = await tx.user.findUnique({
                                    where: { id: userInput.parentUserId },
                                    select: { firstName: true, lastName: true, phone: true, email: true }
                                })

                                if(parentUser && parentUser.phone){
                                    parentGuardian = await tx.guardian.create({
                                        data: {
                                            userId: userInput.parentUserId,
                                            firstName: parentUser.firstName || 'Guardian',
                                            lastName: parentUser.lastName || '',
                                            phone: parentUser.phone,
                                            email: parentUser.email
                                        },
                                        select: { id: true, userId: true }
                                    })
                                }
                            }

                            if(parentGuardian){
                                try {
                                    await tx.guardianStudent.create({
                                        data: {
                                            guardianId: parentGuardian.id,
                                            studentId: profile.id,
                                            isPrimary: true
                                        }
                                    })
                                } catch (error: any) {
                                    // If relation already exists (unique constraint), ignore
                                    if (!error.message?.includes('Unique constraint')) {
                                        throw error
                                    }
                                }
                            }
                        }

                        // Link to additional guardians if guardianUserIds provided
                        if(userInput.guardianUserIds?.length){
                            const guardianProfiles = await tx.guardian.findMany({
                                where: { userId: { in: userInput.guardianUserIds } },
                                select: { id: true, userId: true }
                            })

                            // Create GuardianStudent links for found guardians
                            for (const guardian of guardianProfiles) {
                                try {
                                    await tx.guardianStudent.create({
                                        data: {
                                            guardianId: guardian.id,
                                            studentId: profile.id
                                        }
                                    })
                                } catch (error: any) {
                                    // If relation already exists, continue to next
                                    if (!error.message?.includes('Unique constraint')) {
                                        throw error
                                    }
                                }
                            }

                            // For users that don't have guardian records, create them
                            const missingGuardianIds = userInput.guardianUserIds.filter(
                                id => !guardianProfiles.find(g => g.userId === id)
                            )

                            if(missingGuardianIds.length){
                                const missingUsers = await tx.user.findMany({
                                    where: { id: { in: missingGuardianIds } },
                                    select: { id: true, firstName: true, lastName: true, phone: true, email: true }
                                })

                                for (const user of missingUsers) {
                                    if(user.phone){
                                        const newGuardian = await tx.guardian.create({
                                            data: {
                                                userId: user.id,
                                                firstName: user.firstName || 'Guardian',
                                                lastName: user.lastName || '',
                                                phone: user.phone,
                                                email: user.email
                                            }
                                        })

                                        await tx.guardianStudent.create({
                                            data: {
                                                guardianId: newGuardian.id,
                                                studentId: profile.id
                                            }
                                        })
                                    }
                                }
                            }
                        }

                        // Create fee balances for the student's class and current term
                        const feeStructures = await tx.feeStructure.findMany({
                            where: {
                                schoolId,
                                termId: yearId.id,
                                OR: [
                                    { classId: null },
                                    { classId: classRecord.id }
                                ]
                            },
                            select: { id: true, amount: true }
                        })

                        for (const fee of feeStructures) {
                            try {
                                await tx.feeBalance.create({
                                    data: {
                                        studentId: profile.id,
                                        feeStructureId: fee.id,
                                        amountDue: fee.amount,
                                        amountPaid: 0
                                    }
                                })
                            } catch (error: any) {
                                // If fee balance already exists, continue
                                if (!error.message?.includes('Unique constraint')) {
                                    throw error
                                }
                            }
                        }
                    }

                    // Link existing students to newly created parent
                    if(userInput.role==="PARENT" && userInput.studentUserIds?.length){
                        const guardian = await tx.guardian.findUnique(
                            {
                                where: { id: newUser.id },
                                select: {id: true}
                            }
                        )
                        if(guardian){
                            const studentProfiles = await tx.studentProfile.findMany(
                                {
                                    where: { userId: { in: userInput.studentUserIds }},
                                    select: { id: true },
                                }
                            )
                            if(studentProfiles.length) {
                                for (const student of studentProfiles) {
                                    try {
                                        await tx.guardianStudent.create({
                                            data: {
                                                guardianId: guardian.id,
                                                studentId: student.id
                                            }
                                        })
                                    } catch (error: any) {
                                        // If relation already exists, continue
                                        if (!error.message?.includes('Unique constraint')) {
                                            throw error
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return newUser
                }

            )
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