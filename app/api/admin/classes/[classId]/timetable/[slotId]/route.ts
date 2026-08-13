import { Role } from "@/app/generated/prisma/enums";
import { requireRoleForTenant } from "@/src/lib/tenant";
import { timetableService } from "@/src/services/timetable/timetable.service";
import { ClassParamsContext,  } from "@/src/types";
import { NextRequest, NextResponse } from "next/server";

//makes changes to the timetable
export const PATCH = async(req:NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { classId, slotId } = await context.params
    const { userId } = auth
    const result = await timetableService.updateTimetableSlot(req, userId, classId, slotId);
    return result;
}

//Deletes timetable
export const DELETE = async(req:NextRequest, context: ClassParamsContext) => {
    const auth = await requireRoleForTenant(req, [Role.ADMIN]);
    if(!auth.success){
        return NextResponse.json(
            { error: auth.error},
            { status: auth.status}
        )
    }
    const { classId, slotId } = await context.params
    const { userId } = auth
    const result = await timetableService.deleteTimetableSlot(userId, classId, slotId);
    return result;
}