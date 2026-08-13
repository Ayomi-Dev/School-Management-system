import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/auth/session";
import { enforceRoleAccess, extractSlug, resolveSlugToId } from "./lib/middleware/helpers";

const PUBLIC_PATHS = ["/api/auth/login"];
const BYPASS_PATHS = ["/_next", "/favicon.ico", "/api/health"];


export const middleware = async(req: NextRequest) => {
    const { pathname } = req.nextUrl
    const host = req.headers.get("host") ?? "";

    //bypass routes that don't need resolution at all
    if(BYPASS_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    //extracting sub-domain slug
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "http://faithschool.localhost:3000"
    const slug = extractSlug(host, appDomain);

    if (!slug) {  // No subdomain — show a "school not found" or root landing page
        return NextResponse.redirect(new URL("/not-found", req.url));
    }

    //Resolve slug → schoolId (edge-compatible: use env cache or KV) ──
    //We can't call Prisma from the edge, so we call our own API route
    //OR store a slug→id map in Vercel KV / edge config.
    //Pattern A (simple): call internal API — adds ~20ms, fine for now
    //Pattern B (fast):   Vercel Edge Config — instant, zero latency
    //We'll use Pattern A here, Pattern B shown below as an upgrade note.
    const schoolId = await resolveSlugToId(slug, req);
    if (!schoolId) {
        return NextResponse.rewrite(new URL("/school-not-found", req.url));
    }

    //Inject school context into every request ──────────────
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-school-id", schoolId);
    requestHeaders.set("x-school-slug", slug);

    // Always forward the school context header even for public (non-protected) paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Protected path: enforce authentication
    const token = req.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login`, req.url) //stays on same subdomain
      );
    }

    try {
        const payload  = await verifyAccessToken(token); // Verify the access token and extract the payload (user info, schoolId, etc.)    

        // Critical: make sure this token belongs to THIS school
        if (payload.schoolId !== schoolId) {
          const res = NextResponse.redirect(new URL("/auth/login", req.url));
          res.cookies.delete("access_token");
          res.cookies.delete("refresh_token");
          return res;
        }

        requestHeaders.set("x-user-id", payload.userId);
        requestHeaders.set("x-user-role", payload.role);

        // Role-based path guard
        const roleRedirect = enforceRoleAccess(pathname, payload.role as string);
        if (roleRedirect) {
            return NextResponse.redirect(new URL(roleRedirect, req.url));
        }
    } 
    catch (err) {
        console.log("Middleware token verify error:", err);
        const res = NextResponse.redirect(new URL("/auth/login", req.url));
        res.cookies.delete("access_token");
        res.cookies.delete("refresh_token");
        return res;
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
    
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};