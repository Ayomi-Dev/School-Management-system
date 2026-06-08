import { NextRequest, NextResponse } from "next/server";
import { classService } from "@/src/services/class/class.service";
import { requireSchoolAdmin } from "@/src/lib/middleware/requireRole";

export const POST = async( req: NextRequest) => {
    const auth = await requireSchoolAdmin(req)
    if (!auth.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth
    const result = await classService.createClass(req, schoolId as string);
    return result;
}


export const GET = async(req: NextRequest) => {
    const auth = await requireSchoolAdmin(req)
    if (!auth.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { schoolId } = auth
    const result = await classService.classList(req, schoolId as string)
    return result;
}
