import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req)
    if(!auth.success){
        return NextResponse.json(
            {error: auth.error},
            { status: auth.status }
        )
    }
    const { schoolId } = auth
    const result = await teacherServices.listAllTeachers(req, schoolId as string);
    return result;
}