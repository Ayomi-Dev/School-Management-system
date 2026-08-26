
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { enforceRoleAccess, extractSlug, resolveSlugToId } from "@/src/lib/middleware/helpers";


// ── Paths that skip auth but still need school context ──────────
const PUBLIC_PATHS = [
  "/auth/login",           // ← was missing — this caused the redirect loop
  "/auth/verify-otp",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
];

// ── Paths that skip everything (no slug resolution, no auth) ────
const BYPASS_PATHS = [
  "/_next",
  "/favicon.ico",
  "/api/health",
  "/api/internal/resolve-school",        // ← internal resolver must never loop back through middleware
  "/school-not-found",
  "/not-found",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const isApiRoute = pathname.startsWith("/api/");
  const isBypass = BYPASS_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // ── 1. Hard bypass — no processing at all ───────────────────
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next(); 
  }

  // ── 2. Extract tenant slug from subdomain ───────────────────
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "";
  const slug = extractSlug(host, appDomain);

  if (!slug) {
    return isApiRoute
      ? NextResponse.json({ error: "Unknown tenant" }, { status: 400 })
      : NextResponse.redirect(new URL("/not-found", req.url));
    // return NextResponse.redirect(new URL("/not-found", req.url));
  }

  // ── 3. Resolve slug to schoolId via internal API ─────────────
  //    Edge runtime can't use Prisma directly, so we call our
  //    internal API route — but we must use an absolute URL with
  //    the correct protocol and the non-subdomained base URL.
  const schoolId = await resolveSlugToId(slug, req);
  if (!schoolId) {
    return isApiRoute
      ? NextResponse.json({ error: "School not found" }, { status: 404 })
      : NextResponse.rewrite(new URL("/school-not-found", req.url));
    // return NextResponse.rewrite(new URL("/school-not-found", req.url));
  }

  // ── 4. Inject school context headers into every request ─────
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-school-id", schoolId);
  requestHeaders.set("x-school-slug", slug);

  // ── 5. Public paths — school context injected, no auth needed
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    console.log("[middleware] public path — skipping auth:", pathname, requestHeaders.get("x-school-id"));
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 6. Protected path — verify access token ─────────────────
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    return isApiRoute
      ? NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_ACCESS_SECRET ?? ""
    );
    const { payload } = await jwtVerify(token, secret);
    const session = payload as {
      schoolId: string;
      userId: string;
      role: string;
    };

    // Cross-tenant check
    if (session.schoolId !== schoolId) {
      const res = NextResponse.redirect(new URL("/auth/login", req.url));
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
      return res;
    }

    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    console.error("[middleware] token verification failed:", err);
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// ── resolveSlugToId — edge-safe internal fetch ──────────────────
// Lives in this file to avoid any Node.js-only imports sneaking in
// through the helpers barrel.


