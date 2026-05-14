import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/src/services/auth/auth.service";
import { getSession } from "@/src/lib/auth/session";

export const POST = async(req: NextRequest) => {
    try {
        const session = await getSession(req)
        if(!session || !session.success) {
            return NextResponse.json(
                { error: "You have no active session" }, {status: session.status}
            )
        }
        const { userId } = session.accessPayload
        const logoutResult = await authService.logout(userId);
        return logoutResult;
    } 
    catch (error) {
        return NextResponse.json(
            { error: "An error occurred while logging out" }, {status: 500}
        )
    }
    
}