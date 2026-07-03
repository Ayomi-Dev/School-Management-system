import { NextRequest, NextResponse } from "next/server";
import { parentService } from "@/src/services/parent/parent";
import { requireRole } from "@/src/lib/middleware/requireRole";

export const GET = async (req: NextRequest) => {
    const auth = await requireRole(req, ["PARENT"]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const result = await parentService.getLinkedStudents(userId);
    return result;
}