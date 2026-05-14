import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { superAdminServices } from "@/src/services/super-admin/super-admin.service";

export const GET = async(req: NextRequest) => {
    const auth = await requireSuperAdmin(req)
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    const result = await superAdminServices.getAllSchools(req);
    return result
}