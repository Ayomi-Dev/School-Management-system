import { authService } from "@/src/services/auth/auth.service";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    // Call the refresh token handler to get a new access token
    const result = await authService.refreshSession(req);

    return result;
}