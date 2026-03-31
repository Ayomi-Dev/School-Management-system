import { Role } from "@/app/generated/prisma/enums";
import { PERMISSIONS, Resource, Action } from "@/src/types/permissionType";


export const hasPermission = (role: Role, resource: Resource, action: Action): boolean => {
    const rolePermissions = PERMISSIONS[role];  //Looks up the permission matrix for the user's role. For example, if role is "TUTOR", it retrieves the TUTOR permissions object.
    if (!rolePermissions) return false; //If the role doesn't exist in the PERMISSIONS object, it returns false immediately — no permissions granted.
    const resourcePermissions = rolePermissions[resource]; //Within that role's permissions, it looks up the specific resource (e.g., "scores") to get the array of allowed actions for that resource.
    if (!resourcePermissions) return false; //If the resource isn't defined for that role, it returns false — no permissions for that resource.
    return resourcePermissions.includes(action); //Finally, it checks if the requested action (e.g., "write") is included in the array of allowed actions for that resource. Returns true if allowed, false if not.
}


export const canPerformAction = (role: Role, resource: Resource, action: Action): void => {
    if(!hasPermission(role, resource, action)){
        throw new PermissionError(`Role ${role} does not have permission to ${action} on ${resource}`)
    }
}


export class PermissionError extends Error { //A custom error class that extends the built-in Error class in order to throw and catch permission-related errors in a more specific way, and to identify them by their name property.
    constructor(message: string) {
        super(message);
        this.name = "PermissionError";
    }
}