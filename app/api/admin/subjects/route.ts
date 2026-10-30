import { requireRoleForTenant } from "@/src/lib/tenant";
import { subjectService } from "@/src/services/subject/subject.service";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status }
        )
    }
    const { schoolId } = auth
    const result = await subjectService.listAllSubjects(schoolId as string);
    return result;
}