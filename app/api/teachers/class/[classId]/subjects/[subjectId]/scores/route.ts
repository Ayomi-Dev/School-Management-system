import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";



export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    console.log("incokmig req")
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }

    const { classId, subjectId } = await context.params
    const result = await teacherServices.getScoreRoster(auth.userId, classId, subjectId)
    return result;
}


export const PATCH = async(req: NextRequest, context: ClassParamsContext)  => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }

    const { classId, subjectId } = await context.params
    const result = await teacherServices.updateScoreRoster(req, auth.userId, classId, subjectId);
    return result;
}