import { z } from "zod";

export const RoleEnum = z.enum(["STUDENT", "TEACHER", "PARENT"])
export const GenderEnum = z.enum(["MALE", "FEMALE"]);

export const baseSchemaForUserCreation = z.object({  //
    firstName: z
    .string({ error: "First name is required" })
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, or apostrophes"),

    middleName: z
    .string()
    .max(60)
    .optional(),
 
    lastName: z
    .string({ error: "Last name is required" })
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, or apostrophes"),
 
    email: z
    .string({ error: "Email is required" })
    .email("Must be a valid email address")
    .max(254, "Email is too long") // RFC 5321 max
    .transform((val) => val.toLowerCase().trim())
    .optional(),
 
    phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number format")
    .optional(),
 
    dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((val) => {
      const date = new Date(val);
      const now  = new Date();
      return date < now;
    }, "Date of birth must be in the past")
    .optional(),
 
    gender: GenderEnum.optional(),  
 
    address: z
    .string()
    .max(200, "Address must be 200 characters or fewer")
    .optional(),
 
})


