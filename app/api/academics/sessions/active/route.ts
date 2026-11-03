import { requireRoleForTenant } from "@/src/lib/tenant"
import { academicYearService } from "@/src/services/academics/academic.service"
import { Role } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
    console.log("[GET] auth result:", auth)
    if(!auth.success){
        return NextResponse.json({error: auth.error}, {status: auth.status})
    }
    const { schoolId } = auth
    const activeYear = await academicYearService.getCurrentAcademicYear(schoolId as string)
    return activeYear;
}