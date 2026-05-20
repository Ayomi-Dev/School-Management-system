import { NextRequest } from "next/server";
import { passwordServices } from "@/src/services/passwords/password.service";
import { ParamsContext } from "@/src/types/params"

export const POST = async (req: NextRequest) => {
    const result = await passwordServices.resetPassword(req);
    return result;
}