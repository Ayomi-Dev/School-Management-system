import { Prisma } from "@/app/generated/prisma/browser";
import { AdminCreateUserInput } from "@/src/validators/adminSchema";
import { currentAcademicSession, getCurrentTerm } from "./userCode";
// export const buildUserPayload = (data: AdminCreateUserInput): Prisma.UserCreateInput => {
   
//     switch(data.role){
//         case "STUDENT":
//             return {
//                 studentProfile: {
//                     create: {
//                         level:     data.gradeLevel,
//                         stateOfOrigin:  data.stateOfOrigin,
//                     }
//                 }
//             }
//         case "TEACHER": 
//             return {
//                 teacherProfile: {
//                     create: {
//                         department: data.department,
//                         employeeNumber: data.employeeNumber
//                     }
//                 }
//             }
//         case "PARENT":
//             return {
//                 guardianProfile: {
//                     create: {
//                         relationship: data.relationship,
//                     }
//                 }
//             }
//             default:
//                 return {} as Prisma.UserCreateInput;

//     }
// }

// import { Prisma } from "@/app/generated/prisma";
// import { AdminCreateUserInput } from "@/src/validators/adminSchema";

/**
 * Context injected by the service layer — never from the client.
 * schoolId   : the tenant this user belongs to
 * uniqueCode : pre-generated userCode (student number / employee number)
 */
export interface UserPayloadContext {
  schoolId: string;
  userCode: string; // becomes studentNumber OR employeeNumber depending on role
}

// ─── Return type ──────────────────────────────────────────────────────────────
// We type the return as Prisma.UserCreateInput so TypeScript validates every
// nested `create` block against the actual generated types.
export type UserCreatePayload = Prisma.UserCreateInput;

// ─── Builder ─────────────────────────────────────────────────────────────────

export const buildUserPayload = (
  data: AdminCreateUserInput,
  ctx: UserPayloadContext,
  passwordHash: string
): UserCreatePayload => {
  /**
   * Base fields that map directly onto the User model.
   *
   * Excluded intentionally:
   *   - dateOfBirth → only on StudentProfile, not on User
   *   - gender      → only on StudentProfile, not on User
   *   - address     → no column on User model
   *
   * schoolId is a relation (User.school), so we connect via Prisma relation
   * syntax rather than setting the scalar field directly.
   */
  const base: Prisma.UserCreateInput = {
    userCode: ctx.userCode,
    passwordHash,
    firstName: data.firstName,
    lastName:  data.lastName,
    role:      data.role,
    email:     data.email ?? "", // email is unique & required on User; service must validate presence
    phone:     data.phone ?? null,
    ...(ctx.schoolId
      ? { school: { connect: { id: ctx.schoolId } } }
      : {}),
  };

  switch (data.role) {
    // ── STUDENT ──────────────────────────────────────────────────────────────
    case "STUDENT": {
      /**
       * StudentProfile required fields (non-optional in Prisma):
       *   studentNumber, firstName, lastName, gender, level, schoolId
       *
       * schoolId is injected via ctx; studentNumber via ctx.userCode.
       * All optional fields (dateOfBirth, stateOfOrigin, middleName) are
       * passed only when present to avoid writing explicit `undefined` values.
       */
      const currentTerm = getCurrentTerm();
      const academicSession = currentAcademicSession();
      const dateTime = new Date().toLocaleDateString()
      const studentCreate: Prisma.StudentProfileCreateWithoutUserInput = {
        studentNumber: ctx.userCode,
        firstName:     data.firstName,
        middleName:    data.middleName ?? null,
        lastName:      data.lastName,
        gender:        data.gender,       // Gender enum — required on StudentProfile
        level:         data.gradeLevel,   // ClassLevel enum
        enrolledAt: `${academicSession}/${currentTerm}/${dateTime}`, // e.g. "2024/2025 - 1st Term/09-02-2024"
        school:        { connect: { id: ctx.schoolId } },
        ...(data.dateOfBirth
          ? { dateOfBirth: new Date(data.dateOfBirth) }
          : {}),
        ...(data.stateOfOrigin
          ? { stateOfOrigin: data.stateOfOrigin }
          : {}),
      };

      return {
        ...base,
        studentProfile: { create: studentCreate },
      };
    }

    // ── TUTOR ─────────────────────────────────────────────────────────────────
    case "TEACHER": {
      /**
       * TeacherProfile required fields (non-optional in Prisma):
       *   employeeNumber, firstName, lastName, schoolId
       *
       * Optional teacher-specific fields are only added when present.
       * Subjects are created as nested Subject records for the teacher.
       */
      const teacherCreate: Prisma.TeacherProfileCreateWithoutUserInput = {
        employeeNumber: ctx.userCode,
        firstName:      data.firstName,
        lastName:       data.lastName,
        phone:          data.phone ?? null,
        school:        { connect: { id: ctx.schoolId } },
        ...(data.department  ? { department: data.department } : {}),
        ...(data.joiningDate ? { hiredAt: new Date(data.joiningDate) } : {}),
        ...(data.qualification ? { qualification: data.qualification } : {}),
        ...(data.subjects?.length
          ? {
              subjects: {
                create: data.subjects.map((subjectName) => ({
                  name: subjectName,
                  school: { connect: { id: ctx.schoolId } },
                })),
              },
            }
          : {}),
      };

      return {
        ...base,
        teacherProfile: { create: teacherCreate },
      };
    }

    // ── PARENT ────────────────────────────────────────────────────────────────
    case "PARENT": {
      /**
       * Parent maps to the Guardian model (not a "parentProfile").
       * Guardian required fields (non-optional in Prisma):
       *   firstName, lastName, phone
       *
       * The User→Guardian relation is `guardianProfile` on the User model.
       *
       * studentUserIds (linking existing students) is handled as a separate
       * GuardianStudent upsert in the service layer AFTER user creation —
       * it cannot be expressed in a single nested create without the
       * Guardian id (which doesn't exist yet at this point).
       */
      const guardianCreate: Prisma.GuardianCreateWithoutUserInput = {
        firstName:    data.firstName,
        lastName:     data.lastName,
        phone:        data.phone,          // required for PARENT (enforced in parentSchema)
        email:        data.email ?? null,
        relationship: data.relationship ?? null,
      };

      return {
        ...base,
        guardianProfile: { create: guardianCreate },
      };
    }

    // ── BURSAR ────────────────────────────────────────────────────────────────
    case "BURSAR": {
      // No sub-profile model exists for BURSAR — User fields only.
      return base;
    }

    default: {
      // Exhaustiveness check — TypeScript will flag unhandled variants.
      const _exhaustive: never = data;
      return _exhaustive;
    }
  }
};