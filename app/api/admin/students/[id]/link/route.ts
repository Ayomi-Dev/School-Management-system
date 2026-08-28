import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { prisma } from "@/src/lib/prisma/client";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types/params";
import { linkStudentToGuardians } from "@/src/utils/linkStudentToGuardian";
import { linkStudentToParentSchema } from "@/src/validators/studentSchema";
import { NextRequest, NextResponse } from "next/server";


export const POST = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
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

    const { schoolId } = auth
    const {id } = await context.params
    const result = await  adminServices.linkStudentToParent(req, schoolId as string, id as string )
    return result; 
}