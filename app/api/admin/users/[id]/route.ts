import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolAdmin, requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const PUT = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: 403 }
        )
    }
    
    const { id } = await context.params
    const result = adminServices.updateUser(req, id)
    return result
}
export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: 403 }
        )
    }
    
    const { id } = await context.params
    const { schoolId } = auth
    const result = adminServices.getUserById(schoolId as string, id)
    return result
}

