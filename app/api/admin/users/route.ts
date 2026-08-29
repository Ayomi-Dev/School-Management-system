import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { NextRequest, NextResponse } from "next/server";
import { adminServices } from "@/src/services/admin/admin.service";

export const GET = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { schoolId  } = auth
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");


    const results = await adminServices.getAllUsers(schoolId as string, { role: roleParam, search, page, limit });
    return results; 
}