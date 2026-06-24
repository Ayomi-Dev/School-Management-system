import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { reportCardServices } from "@/src/services/reportCard/reportCard.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { classId, reportCardId } = await context.params
    const { userId } = auth;
    const result = await reportCardServices.getSingleReportCard(userId, classId, reportCardId);
    return result;
}



export const PATCH = async(req: NextRequest, context: ClassParamsContext)  => {
     const auth = await requireSchoolRoles(req, ...[Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { classId, reportCardId } = await context.params
    const { userId } = auth;
    const result = await reportCardServices.updateReportCard(req, userId, classId, reportCardId);
    return result;
}