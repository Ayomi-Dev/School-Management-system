import { prisma } from "@/src/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { superAdminLoginSchema } from "@/src/validators/superAdminSchema";
import { USER_SELECT } from "@/src/lib/prisma/fields";
import { compareHashes } from "@/src/lib/auth/hash";
import { buildTokenCookies, persistRefreshToken, sessionPayload, signAccessToken } from "@/src/lib/auth/session";


export const POST = async(req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = superAdminLoginSchema.safeParse(body);
      
    if(!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }
    const { email, password } = parsed.data
    const user = await prisma.user.findFirst({
        where: { email },
        select: USER_SELECT  //This ensures we get the passwordHash field along with other necessary user details, which is crucial for verifying the password and generating tokens.
    })
    //verifies that a user with the provided email exists and has the SUPER_ADMIN role. If no such user is found, it returns a 401 Unauthorized response indicating that the credentials are invalid.
    if(!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401}
      )
    }
    // Verify password
    const isPasswordValid = await compareHashes(password, user.passwordHash!)  // Compares the provided password with the stored password hash using a secure hashing algorithm. 
    if(!isPasswordValid) {
      return NextResponse.json(
          { error: "Password does not match"},
          { status: 401 }
      )
    }
    const payload = {
      userId: user.id,
      role: user.role, 
    }
    const accessToken = await signAccessToken(payload as sessionPayload); // Generates a signed JWT access token containing the user's ID and role, which will be used for authenticating subsequent requests.
    const rawRefreshToken = await persistRefreshToken(user.id); // Generates a secure random refresh token, hashes it, and stores the hash in the database associated with the user. The raw refresh token is returned to be sent to the client for future token refresh requests.
    const res = NextResponse.json(
      { message: "Login Successful" },
      { status: 200 }
    );
    buildTokenCookies(res, accessToken, rawRefreshToken); // Sets the access token and refresh token as HTTP-only cookies in the response, with appropriate security flags and expiration times to ensure they are stored securely on the client side.
    return res;
  } 
  catch (err) {
    console.error("Authentication Error!:", err);
    return NextResponse.json(
      { error: "Token generation failed!" },
      { status: 500 }
    );
  }

}