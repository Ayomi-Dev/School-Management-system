import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success && auth.shouldRefresh){
        return NextResponse.json(
            { error: auth.error },
            {status: auth.status}
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            {status: auth.status}
        )
    }
    const { schoolId } = auth
    const result = adminServices.provisionUser(req, schoolId as string);

    return result;
}