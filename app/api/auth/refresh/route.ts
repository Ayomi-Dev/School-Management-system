import { refreshTokenHandler } from "@/src/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    console.log("Received request to refresh token");
    // Call the refresh token handler to get a new access token
    const result = await refreshTokenHandler(req);
    console.log("Refresh token handler result:", result)

    return NextResponse.json(result,);
}