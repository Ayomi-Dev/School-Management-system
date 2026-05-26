import { prisma } from "../lib/prisma/client";
import { LinkStudentInput } from "../validators/studentSchema";

type Tx = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;



export interface LinkStudentResult {
  studentId:  string;
  guardianId: string;
  wasExisting: boolean; // true if the Guardian record already existed
}

/**
 * Resolves a User → Guardian record (creating it if absent),
 * then writes guardianId directly onto the StudentProfile.
 *
 * One student has exactly one guardian. Calling this again on the
 * same student simply reassigns to a different guardian.
 *
 * Must be called inside an existing Prisma transaction (tx).
 */
export async function linkStudentToGuardians(
  tx: Tx,
  studentId: string,
  input: LinkStudentInput
): Promise<LinkStudentResult> {
  // ── 1. Verify student exists ──────────────────────────────────────
  const student = await tx.studentProfile.findUnique({
    where:  { id: studentId },
    select: { id: true, guardianId: true },
  });
  if (!student) throw new Error(`StudentProfile ${studentId} not found.`);

  // ── 2. Resolve the guardian user ─────────────────────────────────
  const user = await tx.user.findUnique({
    where:  { id: input.parentUserId },
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  });
  if (!user) throw new Error(`User ${input.parentUserId} not found.`);

  // ── 3. Find or create the Guardian record ────────────────────────
  let wasExisting = true;
  let guardian = await tx.guardian.findUnique({
    where:  { userId: user.id },
    select: { id: true },
  });
  if(guardian){
    if(guardian.id === student.guardianId){
        throw new Error("The student is already linked to this parent")
    }
  }

  if (!guardian) {
    if (!user.phone) {
      throw new Error(
        `User ${input.parentUserId} must have a phone number to be set as a guardian.`
      );
    }
    wasExisting = false;
    guardian = await tx.guardian.create({
      data: {
        userId:    user.id,
        firstName: user.firstName ?? "Guardian",
        lastName:  user.lastName  ?? "",
        phone:     user.phone,
        email:     user.email,
      },
      select: { id: true },
    });
  }

  // ── 4. Stamp guardianId onto the student profile ─────────────────
  await tx.studentProfile.update({
    where: { id: studentId },
    data:  { guardianId: guardian.id },
  });

  return { studentId, guardianId: guardian.id, wasExisting };
}