import { requireRoleForTenant } from "@/src/lib/tenant";
import { termService } from "@/src/services/academics/academic.service";
import { Role } from "@/src/types/enums";
import { NextRequest, NextResponse } from "next/server";



export const GET = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.BURSAR, Role.ADMIN, Role.TEACHER]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error}, { status: 401 });
    }
    const { schoolId } = auth;
    const result = await termService.getTerms(schoolId as string);
    return result;
}