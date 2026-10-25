import { requireRoleForTenant } from "@/src/lib/tenant";
import { feeServices } from "@/src/services/fees/fee.service";
import { Role } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export const GET = async ( req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error }
            ,{ status: auth.status}
        )
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();

    if (!termId) {
      return NextResponse.json(
        { error: "termId query param is required" },
        { status: 400 }
      );
    }
    const { schoolId } = auth;
    const feeStructureList = await feeServices.listFeeStructures(schoolId as string, termId)
    return feeStructureList;
}

export const POST = async ( req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.BURSAR])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();

    if (!termId) {
      return NextResponse.json(
        { error: "termId query param is required" },
        { status: 400 }
      );
    }
    const { schoolId } = auth;
    const feeStructureList = await feeServices.createFeeStructure(req, schoolId as string)
    return feeStructureList;
}