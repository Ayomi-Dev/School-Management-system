import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { ParamsContext } from "@/src/types";
import { Role } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR, Role.PARENT])
    if(!auth.success){
         return NextResponse.json(
            {error: auth.error},
            {status: auth.status}
         )
    }
    const { schoolId } = auth
    const { studentId } = await context.params
    const paymentHistory = await feeServices.getStudentPaymentHistory(schoolId as string, studentId as string)
    return paymentHistory
}