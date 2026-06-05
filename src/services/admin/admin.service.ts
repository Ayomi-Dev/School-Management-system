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
import { linkStudentToGuardians } from "@/src/utils/linkStudentToGuardian";

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

            // Check phone uniqueness
            if(userInput.phone){
                const existingPhone = await prisma.user.findFirst({
                    where: { phone: userInput.phone, schoolId },
                    select: { id: true }
                });
                if(existingPhone){
                    return NextResponse.json(
                        { error: "A user with this phone number already exists" },
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
                                email: true
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
                        console.log("Student profile found:", profile.level);
                        const classRecord = await classService.getOrCreate(tx, schoolId, profile.level, _levelOrder(profile.level))
                        const label      = currentSession();
                        const yearRecord = await resolveAcademicYear(schoolId, label);

                        await tx.enrollment.create({
                            data: {
                              studentId: profile.id,
                              classId: classRecord.id,
                              academicYearId: yearRecord.id,
                              enrolledAt: new Date(),
                            },
                        });

                        // Link to parent guardian if parentUserId provided
                        if (userInput.parentUserId) {
                            await linkStudentToGuardians(tx, profile.id, {
                              parentUserId: userInput.parentUserId,
                            });
                        }
                        // ── Resolve academic year + current term ─────────────────────────
                        const currentTerm = await tx.term.findFirst({
                            where: {
                                academicYearId: yearRecord.id,
                                isCurrent:      true,
                            },
                            select: { id: true },
                        });
                        if (!currentTerm) {
                            throw new Error(
                                `No active term found for academic year "${yearRecord.label}". ` +
                                `Mark a term as current before provisioning students.`
                            );
                        }

                        // ── Fetch applicable fee structures ──────────────────────────────
                        // Matches global fees (classId = null) AND class-specific fees
                        const feeStructures = await tx.feeStructure.findMany({
                            where: {
                                schoolId,
                                termId: currentTerm.id,         // ← Term.id, not AcademicYear.id
                                OR: [
                                    { classId: null },
                                    { classId: classRecord.id },
                                ],
                            },
                            select: { id: true, amount: true },
                        });           

                        // Creates fee balances for the student's class and current term
                        // ── Create fee balances ───────────────────────────────────────────
                        // upsert instead of create so re-provisioning a student never throws
                        for (const fee of feeStructures) {
                            await tx.feeBalance.upsert({
                                where: {
                                    studentId_feeStructureId: {
                                        studentId:      profile.id,
                                        feeStructureId: fee.id,
                                    },
                                },
                                update: {},                     // already exists — leave it alone
                                create: {
                                    studentId:      profile.id,
                                    feeStructureId: fee.id,
                                    amountDue:      fee.amount,
                                    amountPaid:     0,
                                },
                            });
                        }
                        
                    }

                    // Link existing students to newly created parent
                    if(userInput.role==="PARENT" && userInput.studentUserIds?.length){
                        const guardian = await tx.guardian.findUnique(
                            {
                                where: { userId: newUser.id },
                                select: {id: true}
                            }
                        )
                        if(guardian){
                            await tx.studentProfile.updateMany({
                                where: { userId: { in: userInput.studentUserIds } },
                                data:  { guardianId: guardian.id },
                            });
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


   },
   async getUserById(id: string)  {
        const user = await prisma.user.findUnique(
            {
                where: { id },
                select: { id: true, userCode: true, firstName: true, lastName: true, role: true, status: true, createdAt: true, isActive: true, email: true }
            }
        )
        if(!user){
            return NextResponse.json(
                { error: "Sorry, no user with this ID found."},
                { status: 404}
            )
        }
        return NextResponse.json({ user})
   },

   async getAllUsers(schoolId: string, params: { role?: string; search?: string; page?: number; limit?: number }) {
        try{
        const { role, search, page = 1, limit = 10 } = params;
        const whereClause: any = { schoolId };
        if (role) {
            whereClause.role = role;
        }
        if (search) { // search across firstName, lastName, and userCode fields
            whereClause.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { userCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        const users = await prisma.user.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
        });
        return NextResponse.json({ data:users })
        }
        catch(error){
        console.log("Cannot fetch users at this time");
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching users."},
            { status: 500 }
        )
        }
    }
}
