import { Role } from "@/app/generated/prisma/enums";
import { requireRole } from "@/src/lib/middleware/requireRole";
import { studentService } from "@/src/services/student/student.service";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req: NextRequest) => {
    const auth = await requireRole(req, [Role.STUDENT])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();
    const { userId, schoolId } = auth
    const result = await studentService.getStudentAcademicSummary(userId, schoolId as string, termId )
    return result;
}