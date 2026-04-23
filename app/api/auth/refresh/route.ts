import { refreshTokenHandler } from "@/src/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    // Call the refresh token handler to get a new access token
    const result = await refreshTokenHandler(req);

    return result;
}