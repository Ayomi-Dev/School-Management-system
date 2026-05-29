import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { subjectService } from "@/src/services/subject/subject.service";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req);
    if (!auth.success ) {
        return NextResponse.json(
            { error: auth.error },
             { status: auth.status }
        )
    }

    const { schoolId } = auth
    const result = await subjectService.createSubject(req, schoolId as string)
    return result;
}