import { NextRequest, NextResponse } from "next/server";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { bursarService } from "@/src/services/bursar/bursar.service";
import { Role } from "@/app/generated/prisma/enums";


export const GET = async (req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.BURSAR]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error}, { status: 401 });
    }
    
    const { schoolId, userId } = auth;
    const result = await bursarService.getBursarById(userId, schoolId as string)
    return result;
}