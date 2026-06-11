import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET =  async(req: NextRequest, context: ParamsContext ) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error}
        )
    }
    const { id } = await context.params
    const { schoolId } = auth
    const result = adminServices.getAdminProfile(id, schoolId as string)
    return result;
}