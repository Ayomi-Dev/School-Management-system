import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { teacherServices } from "@/src/services/teacher/teacher.service";
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
    const result = await teacherServices.assignSubject(req, schoolId as string)
    return result;
}