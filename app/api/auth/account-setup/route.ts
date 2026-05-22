import { authService } from "@/src/services/auth/auth.service";
import { accountSetupSchema } from "@/src/validators/authSchema";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest) => {
    const body = await req.json()
    const parsedBody = accountSetupSchema.safeParse(body);

    if(!parsedBody.success){
        return NextResponse.json(
            { error: "Validation error", details: parsedBody.error.flatten().fieldErrors}
        )
    }
    const userInput = parsedBody.data
    const result = await authService.accountSetUp(req, userInput );

    return result;

}