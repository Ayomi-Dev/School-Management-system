// src/lib/tenant.ts
import { headers } from "next/headers";
import { prisma } from "./prisma/client";
import { NextRequest } from "next/server";
import { AuthFailure, AuthSuccess, requireRole } from "./middleware/requireRole";
import { Role } from "@/app/generated/prisma/enums";

/**
 * Returns the current tenant's schoolId from middleware-injected headers.
 * Safe to call in Server Components, Route Handlers, and Server Actions.
 */

export type TenantAuthResult = AuthSuccess | AuthFailure

// Accept an optional NextRequest: prefer the request's headers (reliable in route handlers),
// otherwise fall back to the next/headers() helper (useful in Server Components).
export async function getTenantSchoolId(req?: NextRequest): Promise<string> {
  // Prefer the request headers when a NextRequest is available (route handlers).
  if (req) {
    const fromReq = req.headers.get("x-school-id");
    if (fromReq) return fromReq;
    // If missing on req.headers, fall back to next/headers() which sometimes
    // exposes middleware-injected headers in other server contexts.
    console.warn("getTenantSchoolId: x-school-id not found on req.headers, falling back to next/headers()");
  }

  const headersList = await headers();
  const schoolId = headersList.get("x-school-id");
  if (!schoolId) throw new Error("No school context — middleware misconfigured");
  return schoolId;
}

export async function getTenantSchool(req?: NextRequest) {
  const schoolId = await getTenantSchoolId(req);
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
  
  //Tenant resolution — prefer reading x-school-id from the incoming NextRequest
  let tenantSchoolId: string;
  try {
    tenantSchoolId = await getTenantSchoolId(req);
  } catch (err) {
    return { success: false, error: "School context missing", status: 400 };
  }
  console.log("Tenant schoolId from headers:", tenantSchoolId, auth.schoolId, auth.role);
  // If the authenticated user is a SUPER_ADMIN, allow access and map the tenant id
  if (auth.role === Role.SUPER_ADMIN) {
    return {
      success: true,
      userId: auth.userId,
      role: auth.role,
      schoolId: tenantSchoolId,
    };
  }

  // For non-super-admins, we require that the token's schoolId matches the tenant
  if (!auth.schoolId) {
    return { success: false, error: "Forbidden: School association required", status: 403 };
  }

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