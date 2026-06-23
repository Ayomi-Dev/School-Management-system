import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { classService } from "@/src/services/class/class.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { classId } = await context.params
    console.log("class id:", classId)
    const { schoolId } = auth;

    const result = await classService.getClassWithStudents(classId, schoolId);
    return result;
}