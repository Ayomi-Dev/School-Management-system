import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/src/validators/authSchema";
import { authService } from "@/src/services/auth/auth.service";






export const POST = async( req: NextRequest) => {
  const body   = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body); //parses the incoming request body against a predefined schema (loginSchema) to validate the structure and types of the login credentials. If the parsing fails, it returns an error response with details about what went wrong, helping the client understand how to correct their request.
 
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
 
  const credentials = parsed.data;
  console.log(`Login credentials: ${credentials}`);
  const loginResult = await authService.login(credentials, {
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined
  });
 
  return loginResult;
}
