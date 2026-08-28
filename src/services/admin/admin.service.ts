import { adminCreateUserSchema, adminUpdateUserSchema, updateStatusSchema } from "@/src/validators/adminSchema";
import { prisma } from "@/src/lib/prisma/client";
import{ NextRequest, NextResponse } from "next/server"
import { buildUserPayload } from "@/src/utils/userPayloadBuilder";
import { currentSession, generateUserCode } from "../../utils/userCode";
import { generalTempPassword, generateSetUpToken } from "../notification/services";
import { passwordServices } from "../passwords/password.service";
import { resolveAcademicYear } from "@/src/utils/resolvers";
import { classService } from "../class/class.service";
import { _levelOrder } from "@/src/utils/levelOrder";
import { linkStudentToGuardians } from "@/src/utils/linkStudentToGuardian";
import { PaginationMeta } from "@/src/types";
import { linkStudentToParentSchema } from "@/src/validators/studentSchema";

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
        const parsedBody = adminUpdateUserSchema.safeParse(body)
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
        const updatedUser = await prisma.user.update(
            {
                where: { id: user.id},
                data: parsedBody.data
            }
        )
        return NextResponse.json(
            { message: "User details updated successfully", updatedUser},
            { status: 200 }
        )
  },
  async getUserById(schoolId: string, userId: string) {
      try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          OR: [
            { studentProfile: { schoolId } },
            { teacherProfile: { schoolId } },
            { guardianProfile: { userId  } },
          ],
        },
        select: {
          id:        true,
          firstName: true,
          lastName:  true,
          email:     true,
          phone:     true,
          role:      true,
          status:    true,
          createdAt: true,
          studentProfile: {
            select: {
              id:              true,
              studentNumber:   true,
              dateOfBirth:     true,
              guardian: {
                select: {
                  id: true, firstName: true, lastName: true, phone: true } ,
              },
              enrollments: {
                orderBy:  { enrolledAt: 'desc' },
                select: {
                  class: { select: { id: true, level: true } },
                },
              },
            },
          },
          teacherProfile: {
            select: {
              id:            true,
              employeeNumber: true,
              qualification: true,
              classAssignment: {
                select: { isClassTeacher: true,  class: { select: { id: true, level: true } } },
              },
            },
          },
          guardianProfile: {
            select: {
              id: true,
              students: true,
              relationship: true
            }
          }
        },
      });
 
      if (!user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
 
      // Flatten the nested class/enrollment so the frontend gets a clean shape
      const { studentProfile, teacherProfile, guardianProfile, ...rest } = user;
 
      return NextResponse.json({
        data: {
          ...rest,
          studentProfile: studentProfile
            ? {
                id:              studentProfile.id,
                studentNumber:   studentProfile.studentNumber,
                dateOfBirth:     studentProfile.dateOfBirth,
                level:    studentProfile.enrollments[0]?.class.level ?? null,
                guardian: studentProfile.guardian
              }
            : undefined,
          teacherProfile: teacherProfile
            ? {
                id:             teacherProfile.id,
                employeeNumber: teacherProfile.employeeNumber,
                qualification:  teacherProfile.qualification,
                classAssignment: teacherProfile.classAssignment?.class ?? null,
              }
            : undefined,
          guardianProfile: guardianProfile
          ? {
            id: guardianProfile.id,
            students: guardianProfile.students,
            relationship: guardianProfile.relationship
          }
          : undefined
        },
      });
      } 
      catch (error) {
        console.error('[adminService.getUserProfile]', error);
        return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
      }
  },
  async updateUserStatus(req: NextRequest, adminId: string, userId: string, schoolId: string) {
    try {
      const body   = await req.json();
      const parsed = updateStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const { status } = parsed.data;

 
      const targetUser = await prisma.user.findFirst({
        where: {
          id: userId,
          OR: [
            { studentProfile: { schoolId } },
            { teacherProfile: { schoolId } },
          ],
        },
        select: { id: true, status: true },
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      if (targetUser.id === adminId) {
        return NextResponse.json(
          { error: 'You cannot change your own status.' },
          { status: 403 },
        );
      }
      if (targetUser.status === status) {
        return NextResponse.json(
          { error: `User is already ${status}.` },
          { status: 409 },
        );
      }
 
    const updated = await prisma.user.update({
        where:  { id: userId },
        data:   { status },
        select: { id: true, status: true },
    });
 
      return NextResponse.json({
        message: `User status updated to ${status}.`,
        data: updated,
      });
    } catch (error) {
      console.error('[adminService.updateUserStatus]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  async getAdminById(id: string)  {
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
  async getAllUsers(schoolId: string, params: PaginationMeta) {
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
        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where: whereClause }),
        ])
        return NextResponse.json({ data:users, meta: { total, page, limit }})
        }
        catch(error){
        console.log("Cannot fetch users at this time");
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching users."},
            { status: 500 }
        )
        }
  },
  async getStats(schoolId: string) {
      console.log("[adminService.getStats] Fetching stats for schoolId:", schoolId);
        const [
            totalStudents,
            totalTeachers,
            totalParents,
            totalClasses,
            // activeClasses,
            totalUsers,
            feeStats,
        ] = await Promise.all([
        // Students enrolled in this school
        prisma.studentProfile.count({
          where: { schoolId },
        }), 

        // Teachers assigned to this school
        prisma.teacherProfile.count({
          where: { schoolId },
        }), 

        // Parents linked to students in this school
        prisma.guardian.count({
          where: {
            students: {
              some: { schoolId },
            },
          },
        }), 

        // All classes in this school
        prisma.class.count({
          where: { schoolId },
        }), 

        // Active classes (current academic year/term)
        // prisma.class.count({
        //   where: {
        //     schoolId,
        //     academicYear: {
        //       isCurrent: true,
        //     },
        //   },
        // }), 

        // Total user accounts under this school
        prisma.user.count({
          where: { schoolId },
        }), 

        // Revenue: sum of all paid fees for this school
        prisma.feeStructure.aggregate({
          where: {
            schoolId,
            status: 'PAID', 
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);   

      return NextResponse.json({
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
        // activeClasses,
        totalUsers,
        totalRevenue: feeStats._sum.amount ?? 0,
        totalPayments: feeStats._count.id,
      },
      { status: 201 }

    );
  },
  async getAdminProfile(id: string, schoolId: string) {
        const user = await prisma.user.findUnique(
            {
                where: { id },
                select: { id: true, firstName: true, lastName: true, role: true },
            }
        )
        if(!user || user.role !== "ADMIN"){
            return NextResponse.json(
                { error: "Admin record not found"},
                { status: 404 }
            )
        }

        return NextResponse.json(
            { data: user },
            { status: 200 }
        )
  },
  async adminPublishReportCard( schoolId: string, reportCardId: string) {
    try {
      const reportCard = await prisma.reportCard.findUnique({
        where:  { id: reportCardId },
        select: {
          id:            true,
          status:        true,
          teacherRemark: true,
          student: { select: { schoolId: true } },
        },
      });
 
      if (!reportCard || reportCard.student.schoolId !== schoolId) {
        return NextResponse.json({ error: 'Report card not found.' }, { status: 404 });
      }
      if (reportCard.status === 'PUBLISHED') {
        return NextResponse.json(
          { error: 'This report card is already published.' },
          { status: 409 },
        );
      }
      if (!reportCard.teacherRemark?.trim()) {
        return NextResponse.json(
          { error: 'A teacher remark must be added before publishing.' },
          { status: 400 },
        );
      }
 
      const published = await prisma.reportCard.update({
        where:  { id: reportCardId },
        data:   { status: 'PUBLISHED', publishedAt: new Date() },
        select: { id: true, status: true, publishedAt: true },
      });
 
      return NextResponse.json({
        message: 'Report card published successfully.',
        data: published,
      });
    } catch (error) {
      console.error('[adminService.adminPublishReportCard]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
  async adminUnpublishReportCard(schoolId: string, reportCardId: string) {
    try {
      const existing = await prisma.reportCard.findUnique({
        where:  { id: reportCardId },
        select: { id: true, status: true, student: { select: { schoolId: true } } },
      });
      if (!existing || existing.student.schoolId !== schoolId) {
        return NextResponse.json({ error: 'Report card not found.' }, { status: 404 });
      }
      if (existing.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'This report card is not published.' },
          { status: 409 },
        );
      }
 
      const unpublished = await prisma.reportCard.update({
        where:  { id: reportCardId },
        data:   { status: 'DRAFT', publishedAt: null },
        select: { id: true, status: true, publishedAt: true },
      });
 
      return NextResponse.json({
        message: 'Report card unpublished. It is now editable.',
        data: unpublished,
      });
    } catch (error) {
      console.error('[adminService.adminUnpublishReportCard]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
  async getClassDetail(schoolId: string, classId: string) {
    try {
      const classRecord = await prisma.class.findFirst({
        where: { id: classId, schoolId },
        select: {
          id:         true,
          level:      true,
          order:      true,
          department: true,
          // Current class teacher (latest assignment)
          teacherAssignments: {
            take:    1,
            orderBy: { assignedAt: 'desc' },
            select: {
              teacher: {
                select: {
                  id:   true,
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
          subjects: {
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          },
          enrollments: {
            select: {
              id: true,
              student: {
                select: {
                  id:            true,
                  studentNumber: true,
                  user: {
                    select: { id: true, firstName: true, lastName: true, email: true, status: true },
                  },
                },
              },
            },
            orderBy: { enrolledAt: 'asc' },
          },
          _count: {
            select: { enrollments: true, subjects: true },
          },
        },
      });
 
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      // Flatten teacherAssignments array → single teacherAssignment object
      const { teacherAssignments, enrollments, ...rest } = classRecord;
 
      return NextResponse.json({
        data: {
          ...rest,
          teacherAssignment: teacherAssignments[0] ?? null,
          enrollments: enrollments.map((e) => ({
            id: e.id,
            student: {
              id:              e.student.id,
              admissionNumber: e.student.studentNumber,
              user:            e.student.user,
            },
          })),
        },
      });
    } catch (error) {
      console.error('[adminService.getClassDetail]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  async getClassScoreSheet(schoolId: string, classId: string) {
    try {
      // Verify the class belongs to this school
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      // Pull all scores for all students currently enrolled in this class,
      // including the most-recent term info so we can label the sheet.
      //
      // NOTE: no `orderBy` across two different relations here.
      // Prisma + MongoDB cannot sort on two parallel nested-relation arrays
      // in a single query (e.g. term.academicYear.startDate AND
      // student.user.firstName together) — it throws:
      //   "cannot sort with keys that are parallel arrays"
      // So we fetch unsorted and do all ordering in application code below.
      const scores = await prisma.score.findMany({
        where: {
          student: {
            enrollments: { some: { classId } },
          },
        },
        select: {
          totalScore: true,
          caScore:    true,
          examScore:  true,
          grade:      true,
          subject:    { select: { name: true } },
          term: {
            select: {
              id:           true,
              period:       true,
              academicYear: { select: { id: true, label: true, startDate: true } },
            },
          },
          student: {
            select: {
              id:            true,
              studentNumber: true,
              user:          { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
 
      if (scores.length === 0) {
        return NextResponse.json({
          data: { term: '', year: '', subjects: [], rows: [] },
        });
      }
 
      // Determine the most-recent term in-memory (by academicYear.startDate,
      // falling back to whichever term appears most recently in the array).
      const latestTerm = scores.reduce((latest, s) => {
        const latestDate = new Date(latest.term.academicYear.startDate).getTime();
        const currentDate = new Date(s.term.academicYear.startDate).getTime();
        return currentDate > latestDate ? s : latest;
      }, scores[0]).term;
 
      // Filter to that term only (scores are mixed-term if the student has history)
      const termScores = scores.filter((s) => s.term.id === latestTerm.id);
 
      // Collect the unique subject names in alphabetical order
      const subjectSet = new Set(termScores.map((s) => s.subject.name));
      const subjects   = Array.from(subjectSet).sort();
 
      // Build one row per student
      const studentMap = new Map<
        string,
        {
          studentId:       string;
          studentName:     string;
          studentNumber: string | null;
          scores:          Record<string, { ca: number | null; exam: number | null; total: number | null; grade: string | null }>;
        }
      >();
 
      for (const s of termScores) {
        const key  = s.student.id;
        const name = `${s.student.user.firstName} ${s.student.user.lastName}`;
 
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            studentId:       key,
            studentName:     name,
            studentNumber: s.student.studentNumber,
            scores:          {},
          });
        }
        studentMap.get(key)!.scores[s.subject.name] = {
          ca:    s.caScore,
          exam:  s.examScore,
          total: s.totalScore,
          grade: s.grade,
        };
      }
 
      // Sort rows by student name alphabetically — done here in JS,
      // not pushed down to Mongo, since that's what triggered the error.
      const rows = Array.from(studentMap.values()).sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      );
 
      return NextResponse.json({
        data: {
          term:     latestTerm.period,
          year:     latestTerm.academicYear.label,
          subjects,
          rows,
        },
      });
    } catch (error) {
      console.error('[adminService.getClassScoreSheet]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  async publishClassReportCards(schoolId: string, classId: string) {
    try {
      const classRecord = await prisma.class.findFirst({
        where:  { id: classId, schoolId },
        select: { id: true },
      });
      if (!classRecord) {
        return NextResponse.json({ error: 'Class not found.' }, { status: 404 });
      }
 
      // Find all DRAFT cards for students enrolled in this class
      const draftCards = await prisma.reportCard.findMany({
        where: {
          status:  'DRAFT',
          student: {
            enrollments: { some: { classId } },
          },
        },
        select: {
          id:            true,
          teacherRemark: true,
        },
      });
 
      if (draftCards.length === 0) {
        return NextResponse.json({
          message: 'No draft report cards to publish.',
          data: { published: 0, skipped: 0 },
        });
      }
 
      // Split: cards with a remark are publishable; those without are skipped
      const publishable = draftCards.filter((rc) => rc.teacherRemark?.trim());
      const skipped     = draftCards.length - publishable.length;
 
      if (publishable.length > 0) {
        await prisma.reportCard.updateMany({
          where: { id: { in: publishable.map((rc) => rc.id) } },
          data:  { status: 'PUBLISHED', publishedAt: new Date() },
        });
      }
 
      return NextResponse.json({
        message: `${publishable.length} report card(s) published.${skipped > 0 ? ` ${skipped} skipped (no teacher remark).` : ''}`,
        data: { published: publishable.length, skipped },
      });
    } catch (error) {
      console.error('[adminService.publishClassReportCards]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },

  async adminGetSingleReportCard(schoolId: string, reportCardId: string) {
    try {
      const card = await prisma.reportCard.findUnique({
        where: { id: reportCardId },
        select: {
          id:              true,
          status:          true,
          totalScore:      true,
          average:         true,
          position:        true,
          classSnapshot:   true,
          teacherRemark:   true,
          principalRemark: true,
          publishedAt:     true,
          termId:          true,
          createdAt:       true,
          updatedAt:       true,
          student: {
            select: {
              id:            true,
              firstName:     true,
              lastName:      true,
              studentNumber: true,
              gender:        true,
              schoolId:      true,
              enrollments: {
                orderBy: { enrolledAt: 'desc' },
                take:    1,
                select:  { classId: true, class: { select: { level: true } } },
              },
            },
          },
          term: {
            select: { id: true, period: true, academicYear: { select: { label: true } } },
          },
        },
      });
 
      if (!card || card.student.schoolId !== schoolId) {
        return NextResponse.json({ error: 'Report card not found.' }, { status: 404 });
      }
 
      const classId = card.student.enrollments[0]?.classId;
 
      // Subject scores — complete ones only (matching what compile included)
      const scores = await prisma.score.findMany({
        where: {
          studentId: card.student.id,
          termId:    card.termId,
          ...(classId ? { subject: { classId } } : {}),
          caScore:   { not: null },
          examScore: { not: null },
        },
        select: {
          subjectId:   true,
          caScore:     true,
          examScore:   true,
          totalScore:  true,
          grade:       true,
          gradeRemark: true,
          subject: { select: { name: true, code: true } },
        },
        orderBy: { subject: { name: 'asc' } },
      });
 
      // Attendance summary — recomputed fresh so it reflects any corrections
      // made after the initial compile.
      const sessions = classId
        ? await prisma.classSession.findMany({
            where:  { classId, termId: card.termId, label: 'daily' },
            select: { id: true },
          })
        : [];
      const attendanceRows = sessions.length
        ? await prisma.attendance.findMany({
            where: {
              studentId: card.student.id,
              sessionId: { in: sessions.map((s) => s.id) },
            },
            select: { status: true },
          })
        : [];
      const attendanceSummary = {
        total:   sessions.length,
        present: attendanceRows.filter((a) => a.status === 'PRESENT').length,
        absent:  attendanceRows.filter((a) => a.status === 'ABSENT').length,
        late:    attendanceRows.filter((a) => a.status === 'LATE').length,
      };
 
      return NextResponse.json({
        data: {
          reportCard: {
            id:              card.id,
            status:          card.status,
            totalScore:      card.totalScore,
            average:         card.average,
            position:        card.position,
            classSnapshot:   card.classSnapshot,
            teacherRemark:   card.teacherRemark,
            principalRemark: card.principalRemark,
            publishedAt:     card.publishedAt,
            createdAt:       card.createdAt,
            updatedAt:       card.updatedAt,
            term: {
              id:           card.term.id,
              period:       card.term.period,
              academicYear: card.term.academicYear.label,
            },
            classLevel: card.student.enrollments[0]?.class.level ?? null,
          },
          student: {
            id:            card.student.id,
            firstName:     card.student.firstName,
            lastName:      card.student.lastName,
            studentNumber: card.student.studentNumber,
            gender:        card.student.gender,
          },
          scores: scores.map((s) => ({
            subjectId:   s.subjectId,
            subjectName: s.subject.name,
            subjectCode: s.subject.code,
            caScore:     s.caScore,
            examScore:   s.examScore,
            totalScore:  s.totalScore,
            grade:       s.grade,
            gradeRemark: s.gradeRemark,
          })),
          attendanceSummary,
        },
      });
    } catch (error) {
      console.error('[adminService.adminGetSingleReportCard]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
  async getParentsList(schoolId: string) {
    try {
      // Parents are school-scoped through their guardian profile or directly
      // through a parentProfile if your schema has one. Here we use the User
      // table filtered by role=PARENT and joined to the school via Guardian.
      // Adjust the where clause if your schema attaches parents differently.
      const parents = await prisma.user.findMany({
        where: {
          role:   'PARENT',
          schoolId,
        },
        select: {
          id:        true,
          firstName: true,
          lastName:  true,
          email:     true,
          phone:     true,
          status:    true,
          guardianProfile: {
            select: {
              id:     true,
              _count: { select: { students: true } },
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });
 
      return NextResponse.json({
        data: parents.map((p) => ({
          id:          p.id,
          firstName:   p.firstName,
          lastName:    p.lastName,
          email:       p.email,
          phone:       p.phone,
          status:      p.status,
          guardianId:  p.guardianProfile?.id   ?? null,
          linkedCount: p.guardianProfile?._count.students ?? 0,
        })),
      });
    } catch (error) {
      console.error('[adminService.getParentsList]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
   async linkStudentToParent(
    req:           NextRequest,
    schoolId:       string,
    studentUserId: string,
  ) {
    try {
      const body   = await req.json();
      const parsed = linkStudentToParentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const { parentUserId } = parsed.data;
 
      // ── Verify student belongs to this school ─────────────────────
      const studentProfile = await prisma.studentProfile.findFirst({
        where:  { userId: studentUserId, schoolId },
        select: { id: true },
      });
      if (!studentProfile) {
        return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
      }
 
      // ── Verify parent belongs to this school ──────────────────────
      const parentUser = await prisma.user.findFirst({
        where: {
          id:   parentUserId,
          role: 'PARENT',
          schoolId,
        },
        select: { id: true },
      });
      if (!parentUser) {
        return NextResponse.json({ error: 'Parent not found.' }, { status: 404 });
      }
 
      // ── Delegate to the helper inside a transaction ───────────────
      const result = await prisma.$transaction((tx) =>
        linkStudentToGuardians(tx, studentProfile.id, { parentUserId }),
      );
 
      return NextResponse.json({
        message: result.wasExisting
          ? 'Student linked to existing guardian.'
          : 'Guardian record created and student linked.',
        data: result,
      });
    } catch (error) {
      // Surface domain errors from the helper as 409s
      if (error instanceof Error) {
        const domainErrors = [
          'already linked to this parent',
          'must have a phone number',
        ];
        if (domainErrors.some((msg) => error.message.includes(msg))) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
      }
      console.error('[adminService.linkStudentToParent]', error);
      return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
    }
  },
};


