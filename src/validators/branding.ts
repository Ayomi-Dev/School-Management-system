import z from "zod";

export const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour e.g. #1D4ED8')
  .nullable()
  .optional();
 
export const updateBrandingSchema = z.object({
  primaryColor:     hexColor,
  accentColor:      hexColor,
  logoUrl:          z.string().url().nullable().optional(),
  faviconUrl:       z.string().url().nullable().optional(),
  motto:            z.string().trim().max(200).nullable().optional(),
  address:          z.string().trim().max(300).nullable().optional(),
  phone:            z.string().trim().max(30).nullable().optional(),
  email:            z.string().email().nullable().optional(),
  website:          z.string().url().nullable().optional(),
  reportCardFooter: z.string().trim().max(500).nullable().optional(),
});
 