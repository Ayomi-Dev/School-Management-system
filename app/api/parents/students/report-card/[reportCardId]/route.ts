import { NextRequest, NextResponse } from "next/server";
import { parentService } from "@/src/services/parent/parent";
import { requireRole } from "@/src/lib/middleware/requireRole";
import { ClassParamsContext } from "@/src/types";

export const GET = async (req: NextRequest, context: ClassParamsContext) => {
    const auth = await requireRole(req, ["PARENT"]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const { reportCardId } = await context.params;

    const result = await parentService.getStudentReportCard(userId, reportCardId);
    return result;
}