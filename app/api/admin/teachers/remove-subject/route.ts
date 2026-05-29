import { NextRequest, NextResponse } from "next/server";
import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";


export const POST = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req)
    if (!auth.success ) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { schoolId } = auth
    const result = await teacherServices.removeSubjectAssignment(req, schoolId as string)
    return result;
}