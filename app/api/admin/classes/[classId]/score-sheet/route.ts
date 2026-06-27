import { requireSchoolAdmin, requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { ClassParamsContext, ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req:NextRequest, context: ClassParamsContext) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { classId } = await context.params
    const { userId, schoolId } = auth
    const result = await adminServices.getClassScoreSheet(schoolId as string, classId);
    return result;
}