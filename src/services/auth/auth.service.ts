import { verifyPassword } from '@/src/lib/auth/hash';
import { buildTokenCookies, persistRefreshToken, revokeAllUserTokens, signAccessToken } from '@/src/lib/auth/session';
import {prisma}from '@/src/lib/prisma/client';
import { USER_SELECT } from '@/src/lib/prisma/fields';
import { UserLoginInput } from '@/src/validators/authSchema';
import { NextRequest, NextResponse } from 'next/server';

export const authService = {
    async isFirstTimeLogin(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastLoginAt: true }
        });
        return !user?.lastLoginAt; // If lastLoginAt is null, it's the first time login
    },
    async updateLastLogin(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() }
        });
    },
    async getUserRoles(userId: string): Promise<string[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return user ? [user.role] : [];
    },
    async isUserActive(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true }
        });
        return user?.isActive ?? false; // If user not found, treat as inactive
    },

    //login service
    async login( userInput: UserLoginInput, meta: { ipAddress?: string; userAgent?: string }){
        const user = await prisma.user.findUnique(
            { 
                where: { 
                    userCode: userInput.userCode, 
                    email: userInput.email
                },
                select: USER_SELECT
                
            }
        )
        if(!user || !user.passwordHash){
            return NextResponse.json(
                { error: "Invalid credentials or password incorrect" },
                { status: 401 }
            );
        }

        // ── 2. Password check ────────────────────────────────────────────────────────
        const passwordMatches = await verifyPassword(userInput.password, user.passwordHash);
        if(!passwordMatches){
            return NextResponse.json(
                { error: "Password do not match" },
                { status: 401 }
            );
        }
        // ── 3. Lock check ────────────────────────────────────────────────────────────
        if (user?.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            return NextResponse.json(
              { error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
              { status: 429 }
            );
        }

        // ── 4. Status checks ─────────────────────────────────────────────────────────
        if(!user?.isActive || user.status === "SUSPENDED"){
            return NextResponse.json(
                { error: "Your account has been suspended. Contact your administrator." },
                { status: 403 }
            )
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

        // ── 5. Reset failed counter + stamp last login ────────────────────────────────
        await prisma.user.update({
          where: { id: user.id },
          data:  { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        const payload = { 
            userId: user.id, 
            role: user.role, 
            schoolId: user.schoolId 
        };

        const [ accessToken, refreshToken ] = await Promise.all([
            signAccessToken(payload),
            persistRefreshToken(user.id, meta)
        ])
 
        const res = NextResponse.json(
            { message: "Login successful", user},
            { status: 200}
        )
        buildTokenCookies(res, accessToken, refreshToken)
        return res; // Return user data for further processing (e.g., password verification)
    },

    async logout(userId: string) {
        await revokeAllUserTokens(userId) //deletes all refresh tokens for the user, effectively logging them out from all devices/sessions. This is a security measure to ensure that once a user logs out, any existing sessions are invalidated and cannot be used to gain unauthorized access.
        const res = NextResponse.json({ message: "Logout successful" }, { status: 200 });
        res.cookies.set("accessToken", "", { path: "/", expires: new Date(0) });
        res.cookies.set("refreshToken", "", { path: "/", expires: new Date(0) });
        return res; 
    }

}