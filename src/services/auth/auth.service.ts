import { verifyPassword } from '@/src/lib/auth/hash';
import { buildTokenCookies, persistRefreshToken, signAccessToken } from '@/src/lib/auth/session';
import {prisma}from '@/src/lib/prisma/client';
import { UserLoginInput } from '@/src/validators/authSchema';
import { NextResponse } from 'next/server';

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
    async login(userInput: UserLoginInput, meta: { ipAddress?: string; userAgent?: string }){
        const user = await prisma.user.findUnique(
            { 
                where: { 
                    userCode: userInput.userCode, 
                    email: userInput.email
                },
                select: { 
                    id: true, 
                    passwordHash: true, 
                    role: true, 
                    isActive: true, 
                    schoolId: true 
                }
            }
        )
        if(!user || !user.passwordHash || !user.isActive){
            return NextResponse.json(
                { error: "Invalid credentials or inactive user" },
                { status: 401 }
            );
        }

        const passwordMatches = await verifyPassword(userInput.password, user.passwordHash);
        if(!passwordMatches){
            return NextResponse.json(
                { error: "Password do not match" },
                { status: 401 }
            );
        }

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
            { message: "Login successful"},
            { status: 200}
        )
        buildTokenCookies(res, accessToken, refreshToken)
        return res; // Return user data for further processing (e.g., password verification)
    }

}