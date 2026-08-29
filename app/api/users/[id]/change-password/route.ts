import { passwordServices } from "@/src/services/passwords/password.service";
import { ParamsContext } from "@/src/types/params";
import { NextRequest } from "next/server";


export const POST = async (req: NextRequest, context: ParamsContext) => {
    const { id } = await context.params;
    const result = await passwordServices.changePassowrd(req, id as string)
    return result;
}