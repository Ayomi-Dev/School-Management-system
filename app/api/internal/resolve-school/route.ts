// src/app/api/internal/resolve-school/route.ts
import { prisma } from "@/src/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Guard: only the middleware may call this
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const school = await prisma.school.findUnique({
    where: { slug },
    select: { id: true, name: true, isActive: true },
  });

  if (!school || !school.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ schoolId: school.id, name: school.name });
}