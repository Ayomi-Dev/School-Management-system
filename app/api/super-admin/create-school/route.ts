import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { createSchool } from "@/src/services/school/createSchool";



export const POST = async(req: NextRequest) => {
    console.log("Received request to create school");
    const authResult = await requireSuperAdmin(req);
    
    if(!authResult.success && authResult.shouldRefresh) {
        
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        )
    }
    console.log(authResult)
    

    const result = createSchool()
     
    console.log("this is result", result)
    return NextResponse.json({ message: "School created successfully" }, { status: 201 })

    
}