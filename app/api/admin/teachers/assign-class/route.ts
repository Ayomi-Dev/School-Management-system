import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    console.log(" route hit")
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    const { schoolId } = auth
    const result = await teacherServices.assignClassTeacher(req, schoolId as string, auth.userId);
    return result;
}