import { NextRequest, NextResponse } from "next/server";
import { brandingService } from "@/src/services/branding/branding.service";
import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";

export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    const adminId = auth.userId;
    const result = await brandingService.getSchoolBranding(adminId);
    return result;
}

export const PATCH = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    const adminId = auth.userId;
    const result = await brandingService.updateSchoolBranding(req, adminId);
    return result;
}