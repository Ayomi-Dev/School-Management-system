import { Role } from "@/app/generated/prisma/enums";
import { getSession, refreshTokenHandler, verifyAccessToken } from "../auth/session";
import { NextRequest } from "next/server";

interface AuthSuccess {
    success: true;
    userId: string;
    schoolId: string | null;
    role: Role;
}

export interface AuthFailure {
    success: false;
    error: string;
    status: number;
    shouldRefresh?: boolean; // Indicates whether the client should attempt to refresh the access token using the refresh token. This can be used to trigger a token refresh flow on the client side when an access token has expired but a valid refresh token is still available.
}

export type AuthResult = AuthSuccess | AuthFailure;


export const requireRole = async(
    req: NextRequest,
    requiredRoles: Role[],
): Promise<AuthResult> => {
    try {
        const session = await getSession(req); //Calls getSession to retrieve the user's session information from the request. This function checks for the presence of an access token, verifies it, and returns the decoded payload containing user details if the token is valid. If the token is missing or invalid, it returns an error response indicating that the user is unauthorized.
        if(!session.success) {
            return { success: false, error: "Unauthorized: No session found", status: 401, shouldRefresh: true } //If the session retrieval fails (e.g., due to a missing or invalid token), it returns a JSON response with a 401 status code indicating that the user is not authorized to access the resource. The shouldRefresh flag can be used by the client to trigger a token refresh flow if applicable.
        }

        const { accessPayload } = session //destructures the session result to get the access token payload, which contains the user's role and other details. This payload is essential for determining if the user has the necessary permissions to access the resource. The refresh payload can be used to trigger a token refresh if the access token has expired but the refresh token is still valid.
        if(!accessPayload ){
            return { success: false, error: "Unauthorized: Access token expired", status: 401, shouldRefresh: true } 
        }
       
        const { role, userId, schoolId } = accessPayload; //Extracts the user's role from the token payload, which is essential for determining if they have the necessary permissions to access the resource.
        //extracts the sub claim from the token payload, which typically represents the user's unique identifier in the system. This is crucial for associating actions with specific users and enforcing user-specific permissions or data access.
        //Extracts the schoolId from the token payload, which can be used to scope access to resources related to a specific school. If the token doesn't include a schoolId, it defaults to null, allowing for flexibility in handling users that may not be associated with a school.
        if(!requiredRoles.includes(role)){
            return { success: false, error: "Forbidden: Insufficient permissions", status: 403}
        }

        return { success: true, userId, schoolId, role }
    } 
    catch (error) {
        console.log("Token verification failed:", error)
        return { success: false, error: "Internal Server Error", status: 500 }
    }
}


export const requireSuperAdmin = async(req: NextRequest): Promise<AuthResult> => {
    return requireRole(req, [Role.SUPER_ADMIN])
}


export const requireSchoolAdmin = async(req:NextRequest): Promise<AuthResult> => {
    return requireRole(req, [Role.ADMIN])
}

export const requireSchoolRoles = async(
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