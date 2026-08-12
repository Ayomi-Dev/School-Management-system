// src/lib/tenant.ts
import { headers } from "next/headers";
import { prisma } from "./prisma/client";
import { Role } from "../types";
import { NextRequest } from "next/server";
import { AuthFailure, AuthSuccess, requireRole } from "./middleware/requireRole";

/**
 * Returns the current tenant's schoolId from middleware-injected headers.
 * Safe to call in Server Components, Route Handlers, and Server Actions.
 */

export type TenantAuthResult = AuthSuccess | AuthFailure
export async function getTenantSchoolId(): Promise<string> {
  const headersList = await headers();
  const schoolId = headersList.get("x-school-id");
  if (!schoolId) throw new Error("No school context — middleware misconfigured");
  return schoolId;
}

export async function getTenantSchool() {
  const schoolId = await getTenantSchoolId();
  return prisma.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
}

// src/lib/tenant.ts

/**
 * Combines requireRole + tenant resolution + cross-check in one call.
 * Use this instead of calling requireRole directly on tenant-scoped routes.
 */
export async function requireRoleForTenant(
  req: NextRequest,
  requiredRoles: Role[]
): Promise<TenantAuthResult> {
  // Auth check
  const auth = await requireRole(req, requiredRoles);
  if (!auth.success) return auth;

  //Tenant resolution
  let tenantSchoolId: string;
  try {
    tenantSchoolId = await getTenantSchoolId();
  } catch {
    return { success: false, error: "School context missing", status: 400 };
  }

  // Cross-check
  if (auth.schoolId !== tenantSchoolId) {
    return { 
      success: false, 
      error: "Forbidden: School context mismatch", 
      status: 403 
    };
  }

  return {
    success: true,
    userId: auth.userId,
    role: auth.role,
    schoolId: tenantSchoolId, // ← always the subdomain-verified one
  };
}