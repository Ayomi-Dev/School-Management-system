import { Role } from "@/app/generated/prisma/enums";
import { getSession, verifyAccessToken } from "../auth/session";
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
    try {
    const payload = await getSession(req)
    if(!payload) {
        return { success: false, error: "Unauthorized: No session found", status: 401 }
    }

    if ('success' in payload && !payload.success) { //
        return payload;
    }

        const { role, userId, schoolId } = payload as AuthSuccess; //Extracts the user's role from the token payload, which is essential for determining if they have the necessary permissions to access the resource.
        //extracys the sub claim from the token payload, which typically represents the user's unique identifier in the system. This is crucial for associating actions with specific users and enforcing user-specific permissions or data access.
        //Extracts the schoolId from the token payload, which can be used to scope access to resources related to a specific school. If the token doesn't include a schoolId, it defaults to null, allowing for flexibility in handling users that may not be associated with a school.
    console.log("payload:,", payload)
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