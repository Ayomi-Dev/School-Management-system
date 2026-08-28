import { ParamsContext } from "@/src/types";
import {NextRequest} from "next/server";


export const GET = async(req: NextRequest, context: ParamsContext) => {
    console.log("GET request received for school with params:", context.params);
}