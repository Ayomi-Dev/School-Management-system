import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { enrollmentAdminService } from "@/src/services/academics/enrollmentAdmin.service";

export const GET = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: "School association required." }, { status: 403 });
  }

  return enrollmentAdminService.getPromotionData(req, auth.schoolId);
};

export const POST = async (req: NextRequest) => {
  const auth = await requireRoleForTenant(req, [Role.ADMIN]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.schoolId) {
    return NextResponse.json({ error: "School association required." }, { status: 403 });
  }

  return enrollmentAdminService.promoteStudents(req, auth.schoolId);
};
