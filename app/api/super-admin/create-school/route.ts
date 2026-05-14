import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { superAdminServices } from "@/src/services/super-admin/super-admin.service";



export const POST = async(req: NextRequest) => {
    const auth = await requireSuperAdmin(req); //vlaidates the role of the user is SUPER_ADMIN
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    let authId: string | undefined = undefined;
    if(auth.success){
        authId = auth.userId
    }
    const result = await superAdminServices.createSchoolAndAdmin(req, authId);
    return result
}