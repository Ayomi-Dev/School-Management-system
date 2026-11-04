import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { superAdminServices } from "@/src/services/super-admin/super-admin.service";
import { ParamsContext } from "@/src/types/params";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSuperAdmin(req);
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    const { id } = await context.params
    const result = await superAdminServices.deleteSchoolAndAdmin(id as string);

    return result;
}

export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.SUPER_ADMIN, Role.ADMIN, Role.BURSAR, Role.TEACHER, Role.PARENT, Role.STUDENT]);
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    const { id } = await context.params
    const result = await superAdminServices.getSchoolById(id as string)
    return result
}