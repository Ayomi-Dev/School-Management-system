import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { Role } from "@/src/types/enums";
import { ParamsContext } from "@/src/types/params";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
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
    const {id } = await context.params
    const result = await  adminServices.linkStudentToParent(req, schoolId as string, id as string )
    return result; 
}