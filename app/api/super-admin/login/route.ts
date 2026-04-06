import { prisma } from "@/src/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { superAdminLoginSchema } from "@/src/validators/superAdminSchema";
import { USER_SELECT } from "@/src/lib/prisma/fields";
import { compareHashes } from "@/src/lib/auth/hash";
import { buildTokenCookies, issueTokens, sessionPayload, signAccessToken } from "@/src/lib/auth/session";


export const POST = async(req: NextRequest) => {
    const body = await req.json().catch(() => ({}));
    const parsed = superAdminLoginSchema.safeParse(body);

    if(!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        )
    }

    const { email, password } = parsed.data
    console.log(email, password)
    const user = await prisma.user.findFirst({
        where: { email },
        select: {
            ...USER_SELECT,
        }
    })

    if(!user || user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401}
        )
    }

    // Verify password
    const isPasswordValid = await compareHashes(password, user.passwordHash!)
    if(!isPasswordValid) {
        return NextResponse.json(
            { error: "Password does not match"},
            { status: 401 }
        )
    }
    const payload = {
        sub: user.id,
        role: user.role,
    }
    const accessToken = await signAccessToken(payload as sessionPayload);
    const rawRefresh = await issueTokens(user.id);

    const res = NextResponse.json(
        { message: "Login Successful" },
        { status: 200}
    )

    buildTokenCookies(res, accessToken, rawRefresh)

}