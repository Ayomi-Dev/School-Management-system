import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER]);
    if(!auth.success) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    const { userId } = auth
    const result = await teacherServices.getSubjectAssignments(userId);
    return result
}