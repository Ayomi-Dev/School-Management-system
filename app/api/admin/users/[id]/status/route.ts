import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const PATCH = async(req:NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
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