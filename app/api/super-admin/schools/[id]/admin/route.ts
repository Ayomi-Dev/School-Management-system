import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { superAdminServices } from "@/src/services/super-admin/super-admin.service";
import { ParamsContext } from "@/src/types/params";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSuperAdmin(req);
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { id } = await context.params
    const result = await superAdminServices.provisionAdmin(req, id);
    return result;
}