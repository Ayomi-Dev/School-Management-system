import { requireSuperAdmin } from "@/src/lib/middleware/requireRole";
import { schoolsServices } from "@/src/services/school/schools.service";
import { ParamsContext } from "@/src/types/params";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireSuperAdmin(req);
    if(!auth.success && auth.shouldRefresh) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status}
        )
    }
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        )
    }
    const { id } = await context.params
    console.log(`Received request to create admin for school with id: ${id}`);
    const result = await schoolsServices.provisionAdmin(req, id);
    return result;
}