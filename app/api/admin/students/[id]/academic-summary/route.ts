import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { studentService } from "@/src/services/student/student.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req:NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId")?.trim();
    const { id } = await context.params
    const { schoolId } = auth
    const result = await studentService.getStudentAcademicSummary(id, schoolId as string, termId);
    return result;
}