import { requireRoleForTenant } from "@/src/lib/tenant";
import { studentService } from "@/src/services/student/student.service";
import { Role } from "@/src/types/enums";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN,Role.BURSAR, Role.TEACHER])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { schoolId } = auth
    const studentsList = await studentService.listStudents(req, schoolId as string )
    return studentsList;
}