import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const PUT = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    
    const { id } = await context.params
    const result = adminServices.updateUser(req, id as string)
    return result
}
export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    
    const { id } = await context.params
    const { schoolId } = auth
    const result = adminServices.getUserById(schoolId as string, id as string)
    return result
}

