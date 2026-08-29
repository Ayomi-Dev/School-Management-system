import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";



export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    console.log("incokmig req")
    const auth = await requireRoleForTenant(req, [Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }

    const { classId, subjectId } = await context.params
    const result = await teacherServices.getScoreRoster(auth.userId, classId as string, subjectId as string)
    return result;
}


export const PATCH = async(req: NextRequest, context: ClassParamsContext)  => {
    const auth = await requireRoleForTenant(req, [Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }

    const { classId, subjectId } = await context.params
    const result = await teacherServices.updateScoreRoster(req, auth.userId, classId as string, subjectId as string);
    return result;
}