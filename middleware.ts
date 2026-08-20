// middleware.ts
// ❌ Remove this — middleware ONLY runs on the edge runtime
// export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { enforceRoleAccess, extractSlug, resolveSlugToId } from "@/src/lib/middleware/helpers";

console.log("[middleware] module loaded");

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
  "/api/internal",        // ← internal resolver must never loop back through middleware
  "/school-not-found",
  "/not-found",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  console.log("[middleware] hit →", pathname, "| host:", host);

  // ── 1. Hard bypass — no processing at all ───────────────────
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    console.log("[middleware] bypassed:", pathname);
    return NextResponse.next();
  }

  // ── 2. Extract tenant slug from subdomain ───────────────────
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "";
  const slug = extractSlug(host, appDomain);

  console.log("[middleware] slug:", slug, "| appDomain:", appDomain);

  if (!slug) {
    return NextResponse.redirect(new URL("/not-found", req.url));
  }

  // ── 3. Resolve slug → schoolId via internal API ─────────────
  //    Edge runtime can't use Prisma directly, so we call our
  //    internal API route — but we must use an absolute URL with
  //    the correct protocol and the non-subdomained base URL.
  const schoolId = await resolveSlugToId(slug, req);

  console.log("[middleware] schoolId:", schoolId);

  if (!schoolId) {
    return NextResponse.rewrite(new URL("/school-not-found", req.url));
  }

  // ── 4. Inject school context headers into every request ─────
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-school-id", schoolId);
  requestHeaders.set("x-school-slug", slug);

  // ── 5. Public paths — school context injected, no auth needed
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    console.log("[middleware] public path — skipping auth:", pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 6. Protected path — verify access token ─────────────────
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    console.log("[middleware] no token — redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", req.url));
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
      console.warn("[middleware] schoolId mismatch — clearing cookies");
      const res = NextResponse.redirect(new URL("/auth/login", req.url));
      res.cookies.delete("access_token");
      res.cookies.delete("refresh_token");
      return res;
    }

    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-role", session.role);

    // Role-based route guard
    const roleRedirect = enforceRoleAccess(pathname, session.role);
    if (roleRedirect) {
      console.log("[middleware] role redirect:", session.role, "→", roleRedirect);
      return NextResponse.redirect(new URL(roleRedirect, req.url));
    }

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


