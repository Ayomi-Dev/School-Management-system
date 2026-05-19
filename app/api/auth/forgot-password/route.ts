import { NextRequest } from "next/server";
import { passwordServices } from "@/src/services/passwords/password.service";

export const POST = async (req: NextRequest) => {
    const result = await passwordServices.forgotPassword(req);
    return result;
}