import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { parentService } from "@/src/services/parent/parent";
import { studentService } from "@/src/services/student/student.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.PARENT]);
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
    const { id } = await context.params

    const result = parentService.getParentById(id as string)
    return result
}

