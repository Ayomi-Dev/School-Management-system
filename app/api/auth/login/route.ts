import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma/client";
import { loginSchema } from "@/src/validators/authSchema";
import { USER_SELECT } from "@/src/lib/prisma/fields";
import { compareHashes } from "@/src/lib/auth/hash";
import { buildTokenCookies, issueTokens, sessionPayload, signAccessToken } from "@/src/lib/auth/session";

const dummyHash = process.env.DUMMY_HASH
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds


async function handleFailedAttempt(userId: string, currentCount: number) {
  const newCount   = currentCount + 1;
  const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: newCount,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION) : undefined,
    },
  });
}

export const POST = async( req: NextRequest) => {

  const body   = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body); //parses the incoming request body against a predefined schema (loginSchema) to validate the structure and types of the login credentials. If the parsing fails, it returns an error response with details about what went wrong, helping the client understand how to correct their request.
 
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
 
  const credentials = parsed.data;
 
  // Looks up user by the correct identifier ─────────────────────────────
  const user = await prisma.user.findFirst({
    where: { userCode: credentials.userCode},
    select: {
        ...USER_SELECT
    }
  })
    
  // ── 3. Lock check ────────────────────────────────────────────────────────────
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }
 
  // ── 4. Password check ────────────────────────────────────────────────────────
  const hashToCheck  = user?.passwordHash ;
  const passwordMatch = await compareHashes(credentials.password, hashToCheck ?? dummyHash!); //Compares the provided password with the stored hash using bcrypt's compare function. If the user doesn't exist, it compares against a dummy hash to prevent timing attacks that could reveal valid usernames.
 
  
 
  // ── 5. Status checks ─────────────────────────────────────────────────────────
  if (!user?.isActive || user.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Your account has been suspended. Contact your administrator." },
      { status: 403 }
    );
  }
 
  if (user.status === "INACTIVE") {
    return NextResponse.json(
      {
        error: "Account setup incomplete.",
        code:  "SETUP_REQUIRED",
        hint:  "Check your email for the setup link, or ask your administrator to resend it.",
      },
      { status: 403 }
    );
  }
 
  // ── 6. Reset failed counter + stamp last login ────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data:  { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
 
  // ── 7. Sign access token ──────────────────────────────────────────────────────
  const payload = {
    sub:      user.id,
    role:     user.role,
    schoolId: user.schoolId ?? null,
  }
  const accessToken = await signAccessToken(payload as sessionPayload);
 
  // ── 8. Refresh token ──────────────────────────────────────────────────────────
  const rawRefresh = await issueTokens(user.id);
 
  // ── 9. Response ───────────────────────────────────────────────────────────────
  const res = NextResponse.json(
    {
      message: "Login successful",
      user: {
        id:                 user.id,
        email:              user.email,
        firstName:          user.firstName,
        lastName:           user.lastName,
        role:               user.role,
        userCode:           user.userCode,
        schoolId:           user.schoolId,
        mustChangePassword: user.mustChangePassword,
      },
    },
    { status: 200 }
  );
 
  buildTokenCookies(res, accessToken, rawRefresh);
  return res;
}
