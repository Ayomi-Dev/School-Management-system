import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { enrollmentService } from "@/src/services/academics/academic.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest, context: ParamsContext ) => {
    const auth = await requireSchoolRoles(req, ...[Role.STUDENT]);
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
    const { schoolId } = auth
    const result = await enrollmentService.enrollemntList(schoolId)
    return result;
}