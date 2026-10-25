import { Role } from "@/app/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma/client";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { academicYearService } from "@/src/services/academics/academic.service";
import { NextRequest, NextResponse } from "next/server";


export const POST = async( req: NextRequest ) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth
    const result = await prisma.$transaction( async (tx) => {
       await academicYearService.createAcademicYear(req, tx, schoolId as string)
    }) 
    return NextResponse.json({data: result, message: "Academic year created successfully" }, { status: 201 });
}