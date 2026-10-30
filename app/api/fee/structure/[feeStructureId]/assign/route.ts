import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { ClassParamsContext } from "@/src/types";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { feeStructureId } = await context.params
    const { schoolId } = auth
    const assigned = await feeServices.assignFeeBalancesToClass(req, schoolId as string, feeStructureId as string)
    return assigned;
}