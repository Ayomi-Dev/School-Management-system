import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";
import { prisma } from "@/src/lib/prisma/client";
import { ParamsContext } from "@/src/types/params";
import { linkStudentToGuardians } from "@/src/utils/linkStudentToGuardian";
import { linkStudentToParentSchema } from "@/src/validators/studentSchema";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest, context: ParamsContext) => {
    try {
        const auth = await requireSchoolAdmin(req)
        if(!auth.success && auth.shouldRefresh){
            return NextResponse.json(
                    { error: auth.error },
                    {status: auth.status}
                )
        }
        if(!auth.success){
            return NextResponse.json(
                { error: auth.error },
                {status: auth.status}
            )
        }
    
        const body = await req.json();
        const parsedBody = linkStudentToParentSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: parsedBody.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }
    
        const userInput = parsedBody.data;
        const id = new URL(req.url).searchParams.get("id") as string;
        const result = await prisma.$transaction(
            async(tx) => {
               return await linkStudentToGuardians(tx, id, userInput )
            }
        )
        console.log(result)
        return NextResponse.json(
            { 
                message: "Student successfully linked to guardian",
                
            }
        );
        
    } 
    catch (error: any) {
        return NextResponse.json(
        { error: error.message || "Something went wrong" },
        { status: 500 }
    );
    }
}