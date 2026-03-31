import { Role } from "@/app/generated/prisma/enums";


export type Resource =
  | "students"
  | "teachers"
  | "classes"
  | "scores"
  | "attendance"
  | "fees"
  | "report-cards"
  | "announcements"
  | "users"
  | "schools";
 
export type Action = "read" | "write" | "delete" | "publish"; 
 
type PermissionMatrix = Partial<Record<Resource, Action[]>>;
 
export const PERMISSIONS: Record<Role, PermissionMatrix> = {
  SUPER_ADMIN: {
    schools:       ["read", "write", "delete"],
    users:         ["read", "write", "delete"],
    students:      ["read", "write", "delete"],
    teachers:      ["read", "write", "delete"],
    classes:       ["read", "write", "delete"],
    scores:        ["read", "write", "delete", "publish"],
    attendance:    ["read", "write", "delete"],
    fees:          ["read", "write", "delete"],
    "report-cards":["read", "write", "delete", "publish"],
    announcements: ["read", "write", "delete", "publish"],
  },
  ADMIN: {
    users:         ["read", "write"],
    students:      ["read", "write", "delete"],
    teachers:      ["read", "write"],
    classes:       ["read", "write"],
    scores:        ["read", "write", "publish"],
    attendance:    ["read", "write"],
    fees:          ["read", "write"],
    "report-cards":["read", "write", "publish"],
    announcements: ["read", "write", "publish"],
  },
  TUTOR: {
    students:      ["read"],
    classes:       ["read"],
    scores:        ["read", "write"],
    attendance:    ["read", "write"],
    "report-cards":["read"],
    announcements: ["read", "write"],
  },
  BURSAR: {
    students:      ["read"],
    fees:          ["read", "write"],
    announcements: ["read"],
  },
  STUDENT: {
    scores:        ["read"],
    attendance:    ["read"],
    "report-cards":["read"],
    fees:          ["read"],
    announcements: ["read"],
  },
  PARENT: {
    scores:        ["read"],
    attendance:    ["read"],
    "report-cards":["read"],
    fees:          ["read"],
    announcements: ["read"],
  },
};