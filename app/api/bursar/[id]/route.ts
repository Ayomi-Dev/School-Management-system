import { NextRequest, NextResponse } from "next/server";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { Role } from "@/app/generated/prisma/enums";
import { bursarService } from "@/src/services/bursar/bursar.service";


export const GET = async (req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.BURSAR]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error}, { status: 401 });
    }
    
    const { schoolId, userId } = auth;
    const result = await bursarService.getBursarById(userId, schoolId as string)
    return result;
}