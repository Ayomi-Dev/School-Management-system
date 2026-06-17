import { Role } from "@/app/generated/prisma/enums";
import { requireSchoolRoles } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
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

    // ── Pull academicYearId from the query string ───────────────────────────
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId")?.trim();
    console.log("raw academicYearId:", JSON.stringify(academicYearId));


    if (!academicYearId) {
      return NextResponse.json(
        { error: "academicYearId query param is required" },
        { status: 400 }
      );
    }

    const { schoolId } = auth
    const { id } = await context.params
    
    console.log("school id:", schoolId, "studentid:", id)
    const result = await enrollmentService.extractFromEnrollment(id, academicYearId, schoolId )
    return result;
}