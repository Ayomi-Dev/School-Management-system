import { prisma } from "@/src/lib/prisma/client";
import { createSchoolAndAdminSchema } from "@/src/validators/schoolSchema";
import { NextRequest, NextResponse } from "next/server";

export const createSchoolAndAdmin = async(req: NextRequest) => {
    console.log('Super admin wants to create school');
    const body = await req.json()
    const parsedBody = createSchoolAndAdminSchema.safeParse(body); //reads the form inputs sent from the client and parses it
    if(!parsedBody.success) {
        return NextResponse.json(
            { error: "Input validation failed"},
            { status: 400}
        )
    }

    // 

    




    return NextResponse.json(
        { message: parsedBody },
        { status: 201 }
    )
}