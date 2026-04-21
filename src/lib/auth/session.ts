import { jwtVerify, SignJWT } from "jose";
import { Role } from "@/app/generated/prisma/enums";
import { prisma } from "../prisma/client";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto"
import { AuthFailure } from "../middleware/requireRole";
import { hashedRefreshToken } from "./hash";

export interface sessionPayload {
    userId: string;
    schoolId: string | null;
    role: Role;
    iat?: number;
    exp?: number
}

export type SessionResult = { success: true, accessPayload: sessionPayload } | AuthFailure;

const ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET
)

const REFRESH_SECRET = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET
)


export const buildTokenCookies = ( // sets the access and refresh tokens as secure, HTTP-only cookies in the response. It configures the cookies with appropriate flags to enhance security, such as SameSite and Secure, and sets their expiration times according to best practices.
  res: NextResponse,
  accessToken: string,
  rawRefresh: string
) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: "lax",
    path:     "/",
    maxAge:   15 * 60,
  });
  res.cookies.set("refresh_token", rawRefresh, {
    httpOnly: true,
    secure:   isProd,
    sameSite: "lax",
    path:     "/api/auth/refresh", //scopes the refresh token cookie to only be sent to the refresh endpoint, reducing the attack surface for CSRF attacks and ensuring it's only used where needed.
    maxAge:   7 * 24 * 60 * 60, //rate limiting refresh tokens to only be sent to the refresh endpoint and expire after 7 days. This reduces the attack surface for token theft and misuse.
  });
}

export const signAccessToken = async(payload: sessionPayload): Promise<string> => {
    return new SignJWT({ ...payload })  //Creates a new JWT builder from the jose library and spreads your payload into it as the JWT's claims body — the data embedded inside the token.
    .setProtectedHeader({ alg: "HS256"})  //Sets the JWT header, declaring that the token will be signed using HMAC-SHA256 — a symmetric algorithm where the same secret is used to both sign and verify.
    .setIssuedAt()  //Stamps the token with the current time as the iat (issued-at) claim. Useful for auditing and calculating token age.
    .setExpirationTime("15m")  //Sets the exp claim — the time the token expires. After this, the token is rejected automatically during verification.  
    .sign(ACCESS_SECRET) // Performs the actual signing operation using the access token secret, producing a compact JWT string that can be sent to clients and stored securely.
}

export const persistRefreshToken = async(userId: string): Promise<string> => {
  const rawRefreshToken  = crypto.randomBytes(32).toString("hex"); //creates a 64-char hex string
  const refreshHashToken = crypto.createHash("sha256")  //Creates a new hash object using the SHA-256 algorithm, which is a cryptographic hash function that produces a fixed-size 256-bit (32-byte) hash value.
  .update(rawRefreshToken) //Feeds the token string into the hasher.
  .digest("hex"); //Performs the hashing operation and outputs the result as a hexadecimal string, which is what gets stored in the database.
  await prisma.token.create({
    data: {
      userId,
      tokenHash: refreshHashToken,
      type:      "REFRESH",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //expires 7 days from the time of creation
    },
  });
  return rawRefreshToken; // The raw token is returned to be sent to the client, while only the hashed version is stored in the database for security.
}

export const verifyAccessToken = async(token: string): Promise<sessionPayload> => {
    const { payload } = await jwtVerify(token, ACCESS_SECRET) //Uses jose's jwtVerify to do three things at once — verify the signature, check the token hasn't expired, and decode the payload. Throws an error if any check fails.
    return payload as unknown as  sessionPayload //Casts the decoded payload to your custom sessionPayload type since jose returns a generic object. as unknown is needed as an intermediate step because the types don't directly overlap.
}
    

export const verifyRefreshToken = async(token: string): Promise<sessionPayload | null> => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const storedHashedToken = await prisma.token.findFirst({
        where: {
            tokenHash: hashedToken,
            type: 'REFRESH',
            expiresAt: { gt: new Date() } //Checks that the token hasn't expired by ensuring the expiresAt timestamp is in the future.
        },
        include: { user: true } //Joins the related user record so we can return user details in the payload if the token is valid.
    })

    if(!storedHashedToken){
        return null //If no matching token record is found, it means the token is either invalid (not in DB) or expired (past its expiresAt), so we throw an error to indicate verification failure.
    }

    return {
        userId: storedHashedToken.user.id,
        role: storedHashedToken.user.role,
        schoolId: storedHashedToken.user.schoolId
    }
}

export const getSession = async(req: NextRequest): Promise<SessionResult> => {
    try {
        const accessToken =  req.cookies.get("access_token")?.value  //Looks for the cookie named "access_token". The ?.value safely returns undefined instead of crashing if the cookie doesn't exist.
        if(!accessToken) {
            return { success: false, error: "Unauthorized: No access token provided", status: 401 } //If no token is found, it returns a JSON response with a 401 status code indicating that the user is not authorized to access the resource.
        }

        const accessPayload = await verifyAccessToken(accessToken);
        if(!accessPayload){
            return { success: false, error: "Unauthorized: Invalid access token", status: 401 }
        }
        return { success: true, accessPayload };  //Passes the raw token to verifyAccessToken. If valid, returns the decoded user session data to the caller.

    } 
    catch (error) {
        console.log("Error verifying access token:", error)
        return { success: false, error: "Unauthorized: Invalid token", status: 401 } //If verification throws (expired, tampered, malformed token), it's caught here and a failure result is returned.
    }
}


// export const persistRefreshToken = async(
//     userId: string,
//     rawToken: string,
//     metadata: { userAgent: string; ipAddress: string }
// ) => {

//     const expiresAt = new Date( Date.now() + 7 * 24 * 60 * 60 * 1000) // Calculates a timestamp 7 days from now. The math: 7 days × 24 hours × 60 mins × 60 secs × 1000ms. This is the refresh token's TTL (time to live).


//     await prisma.token.create({ //Stores a hashed version of the token — never the raw token itself. If your DB is breached, attackers can't use the hashes directly.
//         data: {
//             userId,
//             tokenHash: generateSetupToken().hashedToken,
//             type: "REFRESH", //Labels this record as a refresh token, since the same Token table may store other token types (e.g., "PASSWORD_RESET", "EMAIL_VERIFY").
//             expiresAt,
//             ...metadata  //Stores the expiry time and spreads in userAgent and ipAddress. Useful for showing users their active sessions and detecting suspicious logins.
//         }
//     })
// }


export const revokeRefreshToken = async(token: string) => { // deletes the corresponding record from your database based on the hashed token value. This ensures that the token can no longer be used to obtain new access tokens.
    await prisma.token.delete({
        where: {
            tokenHash: token
        }
    });
}


export const revokeAllUserTokens = async(userId: string) => { // deletes all refresh tokens associated with a specific user ID, effectively logging the user out from all devices and sessions.
    await prisma.token.deleteMany({
        where: { userId }
    })
}

export const isTokenRevoked = async(token: string): Promise<boolean> => { // checks if a given refresh token has been revoked by looking for its hashed value in the database. If the token is not found, it is considered revoked.
    const hashedToken = hashedRefreshToken(token);
    const tokenRecord = await prisma.token.findUnique({
        where: { tokenHash: hashedToken }
    });
    if(!tokenRecord){
        console.log("Token not found in database, considered revoked:", token)
    }
    return !tokenRecord; // If no record is found, the token is revoked
}

export const refreshTokenHandler = async(req: NextRequest) => {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;
        if(!refreshToken){
            return NextResponse.json({ error: "Unauthorized: No refresh token found"}, {status: 401 });
        }
        // Optionally, you could check if the token has been revoked in the database here before proceeding to generate a new access token.
        
        // refresh token verification 
        const payload  = await verifyRefreshToken(refreshToken)
        console.log("Handling token refresh request", payload)
        
        if(!payload){
            return NextResponse.json({ error: "Unauthorized: Invalid refresh token"}, {status: 401 });
        }

        const {userId, role, schoolId } = payload //Extracts the user details from the refresh token's payload, which will be used to create a new access token with the same user information.
        const newAccessToken = await signAccessToken({userId, role, schoolId}); //signs a new access token using the same user details from the refresh token. This allows the client to continue making authenticated requests without requiring the user to log in again, as long as they have a valid refresh token.

        const res = NextResponse.json({ message: "Token refreshed" }, { status: 201 });
        res.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge:   15 * 60,
        }); //Reuses the same refresh token for simplicity,
        return res; //Returns the new access token and the same payload for both access and refresh since they contain the same user info. The client can use this to update its session state.
    } 
    catch (error) {
        console.log("Error refreshing token:", error);
        return NextResponse.json ({ error: "Internal Server Error", status: 500 });
    }
}




