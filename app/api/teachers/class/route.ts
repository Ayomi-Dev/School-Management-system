import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { getCurrentTerm } from "@/src/utils/userCode";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest ) => {
    const auth = await requireSchoolRoles(req, ...[Role.TEACHER, Role.ADMIN])
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { userId, schoolId } = auth
    const result = await teacherServices.getAssignments(schoolId, userId, getCurrentTerm())
    return result;
}