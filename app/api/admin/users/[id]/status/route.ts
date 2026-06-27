import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const PATCH = async(req:NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { id } = await context.params;
    const { userId, schoolId } = auth
    const result = await adminServices.updateUserStatus(req, userId, id, schoolId as string);
    return result;
}