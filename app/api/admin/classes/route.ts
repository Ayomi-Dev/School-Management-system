import { NextRequest, NextResponse } from "next/server";
import { classService } from "@/src/services/class/class.service";
import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";

export const POST = async( req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
    if (!auth.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth
    const result = await classService.createClass(req, schoolId as string);
    return result;
}


export const GET = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
    if (!auth.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth
    const result = await classService.classList(req, schoolId as string)
    return result;
}
