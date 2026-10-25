import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ClassParamsContext, ParamsContext } from "@/src/types";
import { Role } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { classId } = await context.params 
    const result = await teacherServices.attendanceHistory(req, auth.userId, classId as string);
    return result;
}