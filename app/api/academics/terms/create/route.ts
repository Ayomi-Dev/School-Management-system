import { prisma } from "@/src/lib/prisma/client"
import { requireRoleForTenant } from "@/src/lib/tenant"
import { termService } from "@/src/services/academics/academic.service"
import { Role } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (req: NextRequest) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN])
    if(!auth.success){
        return NextResponse.json({error: auth.error}, {status: auth.status})
    }

    const { schoolId } = auth
    try {
        return await prisma.$transaction((tx) =>
            termService.createTerm(req, tx, schoolId as string)
        )
    } catch (error) {
        console.error("[POST /api/academics/terms/create]", error)
        return NextResponse.json({ error: "Failed to create term." }, { status: 500 })
    }
}
