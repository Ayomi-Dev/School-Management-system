import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { reportCardServices } from "@/src/services/reportCard/reportCard.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.TEACHER, Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { classId } = await context.params
    const { userId } = auth;
    const result = await reportCardServices.getReportCards(userId, classId as string);
    return result;
}