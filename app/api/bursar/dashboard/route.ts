import { requireRoleForTenant } from "@/src/lib/tenant";
import { bursarService } from "@/src/services/bursar/bursar.service";
import { Role } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.BURSAR, Role.ADMIN]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error}, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();

    if (!termId) {
      return NextResponse.json(
        { error: "termId query param is required" },
        { status: 400 }
      );
    }
    const { schoolId, userId } = auth;
    const result = await bursarService.getDashboardSummary(schoolId as string, userId, termId);
    return result;
}