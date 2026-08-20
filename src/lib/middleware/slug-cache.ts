// src/lib/middleware/slug-cache.ts
// Runs on Node.js runtime only — never imported into edge code

import { prisma } from "@/src/lib/prisma/client";

// Simple in-process TTL cache — no Redis needed
// Resets on server restart (fine for dev, fine for a single Vercel instance)
const cache = new Map<string, { schoolId: string; expiresAt: number }>();
const TTL_MS = 60_000; // 60 seconds

export async function resolveSlugToIdDirect(
  slug: string
): Promise<string | null> {
  // 1. Check cache first
  const cached = cache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.schoolId;
  }

  // 2. Miss — hit the database
  try {
    const school = await prisma.school.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!school || !school.isActive) {
      return null;
    }

    // 3. Populate cache
    cache.set(slug, {
      schoolId: school.id,      
      expiresAt: Date.now() + TTL_MS,
    });

    return school.id;
  } catch (err) {
    console.error("resolveSlugToIdDirect: DB query failed:", err);
    return null;
  }
}