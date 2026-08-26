import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { NextRequest, NextResponse } from "next/server";


export const GET = async (req: NextRequest) => {
    console.log("Auth result in GET /admin/stat:");
    const auth = await requireRoleForTenant(req, ["ADMIN"]);

    if (!auth.success) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth;
    const result = await adminServices.getStats(schoolId as string)
    return result;
}