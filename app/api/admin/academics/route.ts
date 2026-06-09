import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { academicYearService } from "@/src/services/academics/academic.service";
import { NextRequest, NextResponse } from "next/server";

export const GET = async(req: NextRequest ) => {
    const auth = await requireSchoolAdmin(req);
    if(!auth.success){
        return NextResponse.json({ error: "Unauthorized. Permission required"}, { status: 401})
    }
    const { schoolId } = auth;
    const result = await academicYearService.listAllAcademicYears(schoolId as string)
    return result;
}