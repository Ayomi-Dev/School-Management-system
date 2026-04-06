import { Role } from "@/app/generated/prisma/enums";
import { verifyAccessToken } from "../auth/session";
import { NextRequest } from "next/server";

interface AuthSuccess {
    success: true;
    userId: string;
    schoolId: string | null;
    role: Role;
}

interface AuthFailure {
    success: false;
    error: string;
    status: number
}

export type AuthResult = AuthSuccess | AuthFailure;


export const requireRole = async(
    req: NextRequest,
    requiiredRoles: Role[],
): Promise<AuthResult> => {
    const token = req.cookies.get("access_token")?.value; //extracts the access token from the incoming request's cookies safely handling the case where the cookie might not exist.

    if(!token){
        return { success: false, error: "Unauthorized: No token provided", status: 401}
    }

    try {
        const payload = await verifyAccessToken(token); //Verifies the token's validity and decodes its payload. If the token is invalid or expired, this will throw an error that we catch below.
        if(!payload){
            return { success: false, error: "Unauthorized: payload cannot be decoded", status: 401}
        }

        const role = payload.role as Role; //Extracts the user's role from the token payload, which is essential for determining if they have the necessary permissions to access the resource.
        const userId = payload.sub as string; //extracys the sub claim from the token payload, which typically represents the user's unique identifier in the system. This is crucial for associating actions with specific users and enforcing user-specific permissions or data access.
        const schoolId = payload.schoolId || null;  //Extracts the schoolId from the token payload, which can be used to scope access to resources related to a specific school. If the token doesn't include a schoolId, it defaults to null, allowing for flexibility in handling users that may not be associated with a school.

        if(!requiiredRoles.includes(role)){
            return { success: false, error: "Forbidden: Insufficient permissions", status: 403}
        }

        return {success: true, userId, schoolId, role }
    } 
    catch (error) {
        console.log("Access token verification failed:", error)
        return { success: false, error: "Unauthorized: Invalid token", status: 401 }
    }
}


export const requireSuperAdmin = async(req: NextRequest): Promise<AuthResult> => {
    return requireRole(req, [Role.SUPER_ADMIN])
}


export const requireSchoolAdmin = async(req:NextRequest): Promise<AuthResult> => {
    return requireRole(req, [Role.ADMIN])
}

export const requireSchoolRoless = async(
    req: NextRequest,
    ...requiredRoles: Exclude<Role, "SUPER_ADMIN">[]
): Promise<AuthResult & { schoolId: string }> => {
    //Calls the more general requireRole function, passing in the request and a combined list of
    //  the specific school roles minus SUPER_ADMIN. This allows both school-specific roles to access the resource.
    const result = await requireRole(req, [...requiredRoles]) 
    if(!result.success) return result as any

    if(!result.schoolId){
        return { success: false, error: "Forbidden: School association required", status: 403 } as any
    }

    return result as AuthResult & { schoolId: string }
} 