import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { subjectService } from "@/src/services/subject/subject.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: "Unauthorized access"},
            { status: 401 }
        )
    }
    const { schoolId } = auth
    const result = await subjectService.listAllSubjects(schoolId as string);
    return result;
}