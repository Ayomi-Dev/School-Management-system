import { prisma } from "@/src/lib/prisma/client";
import { resolveAdminSchool } from "@/src/utils/resolvers";
import { updateBrandingSchema } from "@/src/validators/branding";
import { NextRequest, NextResponse } from "next/server";

export const brandingService = {
    // Returns the branding record for the admin's school.
    // If no record exists yet (school just created), returns null-filled defaults
    // so the page can render a blank form without treating 404 as an error.
    
    async getSchoolBranding(adminId: string) {
        try {
            const schoolId = await resolveAdminSchool(adminId);
            if (!schoolId) {
              return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
            }
 
        const branding = await prisma.schoolBranding.findUnique({
        where:  { schoolId },
        select: {
          id:                true,
          schoolId:          true,
          primaryColor:      true,
          accentColor:       true,
          logoUrl:           true,
          faviconUrl:        true,
          motto:             true,
          address:           true,
          phone:             true,
          email:             true,
          website:           true,
          reportCardFooter:  true,
          updatedAt:         true,
          school: { select: { id: true, name: true } },
        },
        });
      
        // Return empty-field defaults so the frontend never has to guard nulls
        // in the initial form state — it just uses whatever comes back.
        if (!branding) {
          const school = await prisma.school.findUnique({
            where:  { id: schoolId },
            select: { id: true, name: true },
          });
          return NextResponse.json({
            data: {
              id:                null,
              schoolId,
              primaryColor:      null,
              accentColor:       null,
              logoUrl:           null,
              faviconUrl:        null,
              motto:             null,
              address:           null,
              phone:             null,
              email:             null,
              website:           null,
              reportCardFooter:  null,
              updatedAt:         null,
              school,
            },
          });
        }
      
        return NextResponse.json({ data: branding });
        } 
        catch (error) {
          console.error('[schoolBrandingService.getSchoolBranding]', error);
          return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
        }
    },

    // Upserts the branding record — creates on first save, updates thereafter.
    // Uses upsert so the admin never has to think about whether a record exists.
    // Only the fields present in the body are modified (undefined = not sent).
    // ───────────────────────────────────────────────────────────────────────────
    async updateSchoolBranding(req: NextRequest, adminId: string) {
        try {
            const schoolId = await resolveAdminSchool(adminId);
            if (!schoolId) {
              return NextResponse.json({ error: 'Admin profile not found.' }, { status: 404 });
            }
 
            const body   = await req.json();
            const parsed = updateBrandingSchema.safeParse(body);
            if (!parsed.success) {
              return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 },
              );
            }
 
      // Strip undefined keys so we don't accidentally null out untouched fields
        const data = Object.fromEntries(
          Object.entries(parsed.data).filter(([, v]) => v !== undefined),
        );
      
        if (Object.keys(data).length === 0) {
          return NextResponse.json(
            { error: 'No fields to update.' },
            { status: 400 },
          );
        }
      
        const branding = await prisma.schoolBranding.upsert({
          where:  { schoolId },
          create: { schoolId, ...data },
          update: data,
          select: {
            id:                true,
            schoolId:          true,
            primaryColor:      true,
            accentColor:       true,
            logoUrl:           true,
            faviconUrl:        true,
            motto:             true,
            address:           true,
            phone:             true,
            email:             true,
            website:           true,
            reportCardFooter:  true,
            updatedAt:         true,
          },
        });
      
        return NextResponse.json({
          message: 'School branding updated.',
          data:    branding,
        });
          } 
        catch (error) {
          console.error('[schoolBrandingService.updateSchoolBranding]', error);
          return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
        }
    },
 
}