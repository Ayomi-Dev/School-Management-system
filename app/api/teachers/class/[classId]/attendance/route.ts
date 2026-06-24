import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ClassParamsContext, ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { classId } = await context.params
    const result = await teacherServices.manageAttendance(req, auth.userId, classId);
    return result;
}

export const PATCH = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { classId } = await context.params
    const result = await teacherServices.updateAttendance(req, auth.userId, classId)
    return result;
}