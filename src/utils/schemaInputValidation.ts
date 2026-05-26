import { NextRequest, NextResponse } from "next/server";
import { ZodObject } from "zod";

export const validateInput = async (req: NextRequest, schema: ZodObject) => {
    const body = await req.json()
    const parsedBody = schema.safeParse(body)
    if (!parsedBody.success) {
        NextResponse.json(
            {
                error: "Validation failed",
                details: parsedBody.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }
    const userInput = parsedBody.data

    return userInput ;
}