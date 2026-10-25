import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
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