import { NextRequest, NextResponse } from "next/server";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { requireRole } from "@/src/lib/middleware/requireRole";
import { ParamsContext } from "@/src/types";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRole(req, ["TEACHER"]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const result = await teacherServices.getTeacherOverview(userId);
    return result;
}