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
  // Production: "faithschool.myapp.edu.ng" → "faithschool"
  if (appDomain && host.endsWith(`.${appDomain}`)) {
    return host.slice(0, host.length - appDomain.length - 1) || null;
  }

  // Dev: "faithschool.localhost:3000" → "faithschool"
  if (host.includes(".localhost")) {
    const slug = host.split(".localhost")[0];
    return slug || null;
  }

  return null;
}

function getInternalBase(req: NextRequest): string {
  // Explicit env var always wins — set this in .env.local
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Derive from the request: strip the subdomain, keep protocol + port
  // "faithschool.localhost:3000" → "http://localhost:3000"
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = req.nextUrl.protocol ?? "http:";

  // Remove subdomain: "faithschool.localhost:3000" → "localhost:3000"
  const parts = host.split(".");
  // If there's a subdomain (more than one dot segment before the port)
  // take only the last two segments: "localhost:3000"
  const rootHost = parts.length > 1 ? parts.slice(1).join(".") : host;

  return `${protocol}//${rootHost}`;
}

export async function resolveSlugToId(
  slug: string,
  req: NextRequest
): Promise<string | null> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("[middleware] INTERNAL_API_SECRET is not set");
    return null;
  }

  // ── Build a clean base URL that never includes the subdomain ──
  // We need http://localhost:3000 not http://faithschool.localhost:3000
  // because the internal API route lives on the root server, not the
  // virtual subdomain. In the edge sandbox, fetching a subdomain URL
  // can fail because the sandbox resolves hosts differently.
  const base = getInternalBase(req);

  console.log("[middleware] resolving slug via:", `${base}/api/internal/resolve-school?slug=${slug}`);

  try {
    const res = await fetch(
      `${base}/api/internal/resolve-school?slug=${encodeURIComponent(slug)}`,
      {
        method: "GET",
        headers: { "x-internal-secret": secret },
        // Cache at the edge — schools don't rename often
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      console.error("[middleware] resolve-school returned:", res.status);
      return null;
    }

    const data = (await res.json()) as { schoolId?: string };
    return data.schoolId ?? null;
  } catch (err) {
    console.error("[middleware] resolveSlugToId fetch failed:", err);
    return null;
  }
}

export function enforceRoleAccess(pathname: string, role: string): string | null {
  const allowed = ROLE_PATHS[role] ?? [];
  console.log("enforceRoleAccess: Checking access for role:", role, "on path:", pathname, "Allowed paths:", allowed);
  const isAllowed = allowed.some((p) => pathname.startsWith(p));
  if (!isAllowed) return getRoleHome(role);
  return null;
}

function getRoleHome(role: string): string {
  const homes: Record<string, string> = {
    SUPER_ADMIN: "/dashboard/admin",
    ADMIN:       "/dashboard/admin",
    TEACHER:       "/dashboard/teacher",
    STUDENT:     "/dashboard/student",
    PARENT:      "/dashboard/parent",
    BURSAR:      "/dashboard/bursar",
  };
  return homes[role] ?? "/login";
}