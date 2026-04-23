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
    console.log("auth result",auth.success)

    const result = createSchoolAndAdmin(req)
     
    // console.log("this is result", result)
    return result

    
}