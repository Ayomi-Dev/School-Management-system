import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { teacherServices } from "@/src/services/teacher/teacher.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.TEACHER]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: 403 }
        )
    }
    if(!auth.schoolId){
        return NextResponse.json(
            { error: "School id not provided"  },
            { status: 403 }
        )
    }
    const { schoolId } = auth
    const { id } = await context.params
    const result = teacherServices.getTeacherById(id as string, schoolId)
    return result
}

