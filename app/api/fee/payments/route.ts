import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { schoolId, userId } = auth;
    const paymentRecord = await feeServices.recordPayment(req, schoolId as string, userId )
    return paymentRecord;
}

export const GET = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? 100) || 100));
    return feeServices.listPayments(
        auth.schoolId as string,
        params.get('termId') ?? undefined,
        params.get('search')?.trim() || undefined,
        page,
        limit,
    );
};

export const PATCH = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const paymentId = req.nextUrl.searchParams.get('paymentId');
    if (!paymentId) {
        return NextResponse.json({ error: 'paymentId query param is required.' }, { status: 400 });
    }
    return feeServices.updatePayment(req, auth.schoolId as string, paymentId);
};
