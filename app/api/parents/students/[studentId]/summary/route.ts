import { NextRequest, NextResponse } from "next/server";
import { parentService } from "@/src/services/parent/parent";
import { requireRole } from "@/src/lib/middleware/requireRole";
import { ParamsContext } from "@/src/types";

export const GET = async (req: NextRequest, context: ParamsContext) => {
    const auth = await requireRole(req, ["PARENT"]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const searchParams = new URL(req.url).searchParams;
    const termId = searchParams.get("termId") || undefined;
    const { userId } = auth;
    const { studentId } = await context.params;

    const result = await parentService.getStudentSummary(userId, studentId, termId);
    return result;
}