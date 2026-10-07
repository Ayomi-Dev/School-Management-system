import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();
    const { studentId } = await context.params
    const { schoolId } = auth
    const statement = await feeServices.getStudentFeeStatement( schoolId as string, studentId as string, termId as string )
    return statement;
}