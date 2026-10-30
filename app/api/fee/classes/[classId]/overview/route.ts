import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { ClassParamsContext } from "@/src/types";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { searchParams } = new URL(req.url)
    const termId = searchParams.get("termId")
    const academicYearId = searchParams.get("academicYearId")
    const { schoolId } = auth
    const { classId } = await context.params
    const overview = await feeServices.getClassFeeOverview(schoolId as string, classId as string,  termId as string, academicYearId as string )
    return overview;
}