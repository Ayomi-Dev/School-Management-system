import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/app/generated/prisma/enums";
import { brandingService } from "@/src/services/branding/branding.service";
import { requireRoleForTenant } from "@/src/lib/tenant";

export const GET = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    const adminId = auth.userId;
    const result = await brandingService.getSchoolBranding(adminId);
    return result;
}

export const PATCH = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    const adminId = auth.userId;
    const result = await brandingService.updateSchoolBranding(req, adminId);
    return result;
}