import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    const { schoolId } = auth
    const result = await adminServices.getParentsList(schoolId as string)
    return result;
}