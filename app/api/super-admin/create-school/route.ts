import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { createSchoolAndAdmin } from "@/src/services/school/createSchoolAndAdmin";



export const POST = async(req: NextRequest) => {
    console.log("Received request to create school");
    const auth = await requireSuperAdmin(req); //vlaidates the role of the user is SUPER_ADMIN
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }

    let authId: string | undefined = undefined;
    if(auth.success){
        authId = auth.userId
    }

    console.log("auth id", authId)

    const result = createSchoolAndAdmin(req, authId)
     
    // console.log("this is result", result)
    return result

    
}