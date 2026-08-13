import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolAdmin, requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { academicYearService } from "@/src/services/academics/academic.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN, Role.STUDENT, Role.TEACHER]);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: auth.status})
    }
    const { schoolId } = auth;
    const result = await academicYearService.listAllAcademicYears(schoolId as string)
    return result;
}

export const POST = async(req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json({ error: auth.error }, { status: auth.status})
    }
    const { schoolId } = auth;
    const result = await prisma.$transaction(async (tx) => {
        return await academicYearService.createAcademicYear(req, tx, schoolId as string)
    })
    return result;
}


