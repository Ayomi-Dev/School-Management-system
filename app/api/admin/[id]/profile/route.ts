import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { adminServices } from "@/src/services/admin/admin.service";
import { ParamsContext } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    const auth = await requireRoleForTenant(req, ["ADMIN"]);
    console.log("Auth result in GET /admin/profile:", auth);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error },
            { status: 403 }
        )
    }
    if(!auth.schoolId){
        return NextResponse.json(
            { error: "School id not provided"  },
            { status: 403 }
        )
    }
    const { id } = await context.params
    const result = adminServices.getAdminById(id)
    return result
}

