import { NextRequest } from "next/server";
const ROLE_PATHS: Record<string, string[]> = {
  ADMIN:       ["/dashboard/admin", "/students", "/teachers", "/classes", "/academics", "/fees", "/announcements"],
  SUPER_ADMIN: ["/dashboard/admin", "/schools"],
  TUTOR:       ["/dashboard/teacher", "/classes", "/attendance", "/academics/scores"],
  STUDENT:     ["/dashboard/student"],
  PARENT:      ["/dashboard/parent"],
  BURSAR:      ["/dashboard/bursar", "/fees"],
};

export function extractSlug(host: string, appDomain: string): string | null {
  // "faithschool.myapp.edu.ng" → "faithschool"
  if (host.endsWith(`.${appDomain}`)) {
    return host.slice(0, host.length - appDomain.length - 1);
  }
  // Dev: "faithschool.localhost:3000" → "faithschool"
  if (host.includes(".localhost")) {
    return host.split(".localhost")[0];
  }
  return null;
}


export async function resolveSlugToId(
  slug: string,
  req: NextRequest
): Promise<string | null> {
  try {
    // Call our internal resolver — runs on the same origin so it's fast
    const res = await fetch(
      `${req.nextUrl.origin}/api/internal/resolve-school?slug=${slug}`,
      {
        headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
        // Cache the result for 60s at the edge — schools don't rename often
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.schoolId ?? null;
  } catch {
    return null;
  }
}

export function enforceRoleAccess(pathname: string, role: string): string | null {
  const allowed = ROLE_PATHS[role] ?? [];
  const isAllowed = allowed.some((p) => pathname.startsWith(p));
  if (!isAllowed) return getRoleHome(role);
  return null;
}

function getRoleHome(role: string): string {
  const homes: Record<string, string> = {
    SUPER_ADMIN: "/dashboard/admin",
    ADMIN:       "/dashboard/admin",
    TUTOR:       "/dashboard/teacher",
    STUDENT:     "/dashboard/student",
    PARENT:      "/dashboard/parent",
    BURSAR:      "/dashboard/bursar",
  };
  return homes[role] ?? "/login";
}