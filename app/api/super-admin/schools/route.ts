import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { schoolsServices } from "@/src/services/school/schools.service";

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

    const result = await schoolsServices.getAllSchools(req);
    return result
}