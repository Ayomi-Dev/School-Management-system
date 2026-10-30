import { requireRoleForTenant } from "@/src/lib/tenant";
import { reportCardServices } from "@/src/services/reportCard/reportCard.service";
import { ClassParamsContext } from "@/src/types";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async(req: NextRequest, context: ClassParamsContext) => { //COMPILES REPORT CARDS
    const auth = await requireRoleForTenant(req, [Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { classId } = await context.params;
    const { userId } = auth
    const result = await reportCardServices.compileReportCards(req, userId, classId as string) ;
    return result;
}


export const GET = async(req: NextRequest, context: ClassParamsContext) => { //GET ALL REPORT CARDS
    const auth = await requireRoleForTenant(req, [Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { classId } = await context.params;
    const { userId } = auth
    const result = await reportCardServices.getReportCards( userId, classId as string) ;
    return result;
}