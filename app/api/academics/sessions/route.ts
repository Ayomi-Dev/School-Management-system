import { requireRoleForTenant } from "@/src/lib/tenant";
import { academicYearService } from "@/src/services/academics/academic.service";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.STUDENT, Role.TEACHER, Role.BURSAR]);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: auth.status})
    }
    const { schoolId } = auth;
    const result = await academicYearService.listAllAcademicYears(schoolId as string)
    return result;
}