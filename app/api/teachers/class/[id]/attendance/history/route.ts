import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const classId = (await context.params).id
    const result = await teacherServices.attendanceHistory(req, auth.userId, classId);
    return result;
}