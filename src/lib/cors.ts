// src/lib/cors.ts
import { NextRequest, NextResponse } from "next/server";


/**
 * Returns the CORS headers appropriate for the incoming request's origin.
 * If the origin isn't in our allowlist, we don't echo it back —
 * the browser will then block the request (correct behaviour).
 * 
 */

function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === "production") {
    return (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  // Dev — cover every origin combination you'll hit locally
  return [
    "http://localhost:3001",               // landing page (its own dev server)
    "http://faithschool.localhost:3000",   // SaaS subdomain in dev
    "http://hopeschool.localhost:3000",    // other test tenants
    "http://localhost:3000",               // SaaS app root (no subdomain)
  ];
}


export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  // Echo back the exact origin if it's in our list.
  // Never use "*" — it breaks credentials:include.
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : "";

  // Debug: log the mismatch in development so you catch it immediately
  if (process.env.NODE_ENV === "development" && origin && !allowedOrigin) {
    console.warn(
      `[CORS] Blocked origin: "${origin}"\n` +
      `       Add it to getAllowedOrigins() in src/lib/cors.ts\n` +
      `       Allowed: ${JSON.stringify(allowedOrigins)}`
    );
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-school-slug",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "3600",
  };
}


/**
 * Handles the OPTIONS preflight request.
 * Call this at the top of every route handler that accepts cross-origin requests.
 *
 * Usage:
 *   export async function POST(req: NextRequest) {
 *     const preflight = handlePreflight(req);
 *     if (preflight) return preflight;
 *     // ... rest of handler
 *   }
 */
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}

/**
 * Wraps a NextResponse with the correct CORS headers.
 * Call this before returning any response from a cross-origin route handler.
 */
export function withCors(res: NextResponse, req: NextRequest): NextResponse {
  const corsHeaders = getCorsHeaders(req);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (value) res.headers.set(key, value);
  });
  return res;
}