import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { subjectService } from "@/src/services/subject/subject.service";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
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