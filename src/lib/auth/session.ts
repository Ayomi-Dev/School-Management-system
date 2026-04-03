import { jwtVerify, SignJWT } from "jose";
import { Role } from "@/app/generated/prisma/enums";
import { cookies } from "next/headers";
import { prisma } from "../prisma/client";
import { hashToken } from "./hash";

export interface sessionPayload {
    sub: string;
    schoolId: string;
    role: Role;
    iat?: number;
    exp?: number
}
const ACCESS_SECRET = new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET
)

const REFRESH_SECRET = new TextEncoder().encode(
    process.env.JWT_REFRESH_SECRET
)


export const signAccessToken = async(payload: sessionPayload): Promise<string> => {
    return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256"})
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET)
}

export const signRefreshToken = async(payload: sessionPayload): Promise<string> => {
    return new SignJWT({ ...payload })  //Creates a new JWT builder from the jose library and spreads your payload into it as the JWT's claims body — the data embedded inside the token.
    .setProtectedHeader({ alg: "HS256"})  //Sets the JWT header, declaring that the token will be signed using HMAC-SHA256 — a symmetric algorithm where the same secret is used to both sign and verify.
    .setIssuedAt()  //Stamps the token with the current time as the iat (issued-at) claim. Useful for auditing and calculating token age.
    .setExpirationTime("7d")  //Sets the exp claim — the time the token expires. After this, the token is rejected automatically during verification.  
    .sign(REFRESH_SECRET) // Performs the actual signing operation using the refresh token secret, producing a compact JWT string that can be sent to clients and stored securely.
}

export const verifyAccessToken = async(token: string): Promise<sessionPayload | null> => {
    const { payload } = await jwtVerify(token, ACCESS_SECRET) //Uses jose's jwtVerify to do three things at once — verify the signature, check the token hasn't expired, and decode the payload. Throws an error if any check fails.
    return payload as unknown as  sessionPayload //Casts the decoded payload to your custom sessionPayload type since jose returns a generic object. as unknown is needed as an intermediate step because the types don't directly overlap.
}
    

export const verifyRefreshToken = async(token: string): Promise<sessionPayload> => {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as sessionPayload
}

export const getSession = async(token: string): Promise<sessionPayload | null> => {
    try {
        const cookieStoredToken = await cookies(); //Calls Next.js's cookies() function to access the incoming request's cookie jar — this only works in Server Components, Server Actions, or Route Handlers.
        const tokenFromCookie = cookieStoredToken.get("access_token")?.value  //Looks for the cookie named "access_token". The ?.value safely returns undefined instead of crashing if the cookie doesn't exist.

        if(!tokenFromCookie) return null;

        const payload = await verifyAccessToken(tokenFromCookie);
        return payload;  //Passes the raw token to verifyAccessToken. If valid, returns the decoded user session data to the caller.

    } 
    catch (error) {
        console.log("Error verifying access token:", error)
        return null //If verification throws (expired, tampered, malformed token), it's caught here and null is returned silently instead of crashing the app.
    }
}


export const persistRefreshToken = async(
    userId: string,
    rawToken: string,
    metadata: { userAgent: string; ipAddress: string }
) => {

    const expiresAt = new Date( Date.now() + 7 * 24 * 60 * 60 * 1000) // Calculates a timestamp 7 days from now. The math: 7 days × 24 hours × 60 mins × 60 secs × 1000ms. This is the refresh token's TTL (time to live).


    await prisma.token.create({ //Stores a hashed version of the token — never the raw token itself. If your DB is breached, attackers can't use the hashes directly.
        data: {
            userId,
            tokenHash: await hashToken(rawToken),
            type: "REFRESH", //Labels this record as a refresh token, since the same Token table may store other token types (e.g., "PASSWORD_RESET", "EMAIL_VERIFY").
            expiresAt,
            ...metadata  //Stores the expiry time and spreads in userAgent and ipAddress. Useful for showing users their active sessions and detecting suspicious logins.
        }
    })
}


export const revokeRefreshToken = async(token: string) => { // deletes the corresponding record from your database based on the hashed token value. This ensures that the token can no longer be used to obtain new access tokens.
    const tokenHash = await hashToken(token);
    await prisma.token.deleteMany({
        where: {
            tokenHash
        }
    });
}


export const revokeAllUserTokens = async(userId: string) => { // deletes all refresh tokens associated with a specific user ID, effectively logging the user out from all devices and sessions.
    await prisma.token.deleteMany({
        where: { userId }
    })
}

export const isTokenRevoked = async(token: string): Promise<boolean> => { // checks if a given refresh token has been revoked by looking for its hashed value in the database. If the token is not found, it is considered revoked.
    const tokenHash = await hashToken(token);
    const tokenRecord = await prisma.token.findUnique({
        where: { tokenHash }
    });
    return !tokenRecord; // If no record is found, the token is revoked
}

