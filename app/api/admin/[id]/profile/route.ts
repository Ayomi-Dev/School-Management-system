import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { academicYearService, enrollmentService } from "@/src/services/academics/academic.service";
import { adminServices } from "@/src/services/admin/admin.service";
import { adminService } from "@/src/services/client/admin";
import { studentService } from "@/src/services/student/student.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSchoolRoles(req, ...[Role.ADMIN]);
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
    const result = adminServices.getUserById(id)
    return result
}

