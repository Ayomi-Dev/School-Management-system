import { NextRequest, NextResponse } from "next/server";
import { parentService } from "@/src/services/parent/parent";
import { Role } from "@/src/types/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";

export const GET = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.PARENT]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const result = await parentService.getLinkedStudents(userId);
    return result;
}