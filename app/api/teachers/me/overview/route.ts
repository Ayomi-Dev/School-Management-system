import { NextRequest, NextResponse } from "next/server";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ParamsContext } from "@/src/types";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { Role } from "@/app/generated/prisma/enums";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.TEACHER]);
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { userId } = auth;
    const result = await teacherServices.getTeacherOverview(userId);
    return result;
}