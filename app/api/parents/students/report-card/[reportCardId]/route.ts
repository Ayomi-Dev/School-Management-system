import { NextRequest, NextResponse } from "next/server";
import { parentService } from "@/src/services/parent/parent";
import { ClassParamsContext } from "@/src/types";
import { Role } from "@/src/types/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";

export const GET = async (req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.PARENT]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const { reportCardId } = await context.params;

    const result = await parentService.getStudentReportCard(userId, reportCardId as string);
    return result;
}