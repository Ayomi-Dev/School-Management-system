import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { ClassParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req:NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { schoolId } = auth
    const { reportCardId } = await context.params
    const result = await adminServices.adminPublishReportCard(schoolId as string, reportCardId);
    return result;
}