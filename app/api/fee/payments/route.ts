import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { Role } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { schoolId } = auth;
    const paymentRecord = await feeServices.recordPayment(req, schoolId as string )
    return paymentRecord;
}