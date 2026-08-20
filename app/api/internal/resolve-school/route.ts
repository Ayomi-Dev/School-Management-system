// src/app/api/internal/resolve-school/route.ts
import { prisma } from "@/src/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log('[internal/resolve-school] invoked', { host: req.headers.get('host'), secretPresent: !!req.headers.get('x-internal-secret') });
  // Guard: only the middleware may call this
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    console.log('[internal/resolve-school] secret mismatch or missing');
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    console.log('[internal/resolve-school] missing slug');
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  console.log('[internal/resolve-school] resolving slug', { slug });
  const school = await prisma.school.findUnique({
    where: { slug },
    select: { id: true, name: true, isActive: true },
  });

  if (!school || !school.isActive) {
    console.log('[internal/resolve-school] school not found or inactive', { slug });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  console.log('[internal/resolve-school] resolved', { slug, schoolId: school.id });
  return NextResponse.json({ schoolId: school.id, name: school.name });
}