import { getSession } from "@/src/lib/auth/session";
import { authService } from "@/src/services/auth/auth.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    // Use access_token as the guard — refresh_token won't be sent to this path
    const accessToken = req.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ message: "Already logged out" }, { status: 200 });
    }

    const session = await getSession(req);
    if (!session || !session.success) {
      return NextResponse.json(
        { error: "You have no active session" },
        { status: session.status }
      );
    }

    const { userId } = session.accessPayload;
    await authService.logout(userId);

    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ message: "Logout successful" }, { status: 200 });
    res.cookies.set("access_token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    res.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/api/auth/refresh", // matches how it was set
      expires: new Date(0),
    });
    return res;

  } catch (error) {
    console.error("Error occurred while logging out:", error);
    return NextResponse.json(
      { error: "An error occurred while logging out" },
      { status: 500 }
    );
  }
};