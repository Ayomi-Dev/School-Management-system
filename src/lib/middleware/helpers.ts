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

function stripSubdomain(req: NextRequest): string {
  // Derive from the request: strip the subdomain, keep protocol + port
  // "faithschool.localhost:3000" → "http://localhost:3000"
  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = req.nextUrl.protocol ? `${req.nextUrl.protocol}//` : "http://";

  // Remove subdomain: "faithschool.localhost:3000" → "localhost:3000"
  const parts = host.split(".");
  // If there's a subdomain (more than one dot segment before the port)
  // take only the last two segments: "localhost:3000"
  const rootHost = parts.length > 1 ? parts.slice(1).join(".") : host;

  return `${protocol}${rootHost}`;
}

function getInternalBase(req: NextRequest): string {
  // Explicit env var always wins set only as production value. i.e the root domain with NO subdomain prefix.
  const explicit = process.env.INTERNAL_FETCH_BASE;
  if (explicit) {
    // Strip any accidental trailing slash
    return explicit.replace(/\/$/, "");
  }

  const rootUrl = stripSubdomain(req);
  return rootUrl;
  
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
  // console.log("[middleware] resolveSlugToId: base URL for internal fetch:", base, "slug:", slug);

  console.log("[middleware] resolving slug via:", `${base}/api/internal/resolve-school?slug=${slug}`);
  const url = `${base}/api/internal/resolve-school?slug=${encodeURIComponent(slug)}`

  try {
    const res = await fetch(
      url,
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
