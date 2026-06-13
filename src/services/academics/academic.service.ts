import { prisma } from "@/src/lib/prisma/client";
import { TermPeriod } from "@/app/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";
import {  updateAcademicYearSchema } from "@/src/validators/schoolSchema";
import { resolveTermByPeriod } from "@/src/utils/resolvers";


// export const academicService = {
//     async createAcademicYear(schoolId: string, payload: {
//       label: string;
//       startDate: Date;
//       endDate: Date;
//       setCurrent?: boolean;
//     }) {
//       return prisma.$transaction(async (tx) => {
//         if (payload.setCurrent) {
//           await tx.academicYear.updateMany({
//             where: { schoolId, isCurrent: true },
//             data: { isCurrent: false }
//           });
//         }
      
//         const year = await tx.academicYear.create({
//           data: {
//             schoolId,
//             label: payload.label,
//             startDate: payload.startDate,
//             endDate: payload.endDate,
//             isCurrent: payload.setCurrent ?? false
//           }
//         });
      
//         return year;
//       });
//     },
  
//     async createTerm(academicYearId: string, payload: {
//       period: TermPeriod;
//       startDate: Date;
//       endDate: Date;
//       setCurrent?: boolean;
//     }) {
//         return prisma.$transaction(async (tx) => {
//             if (payload.setCurrent) { // if the new term is set to be current, set all other terms in the same academic year to not current
//               await tx.term.updateMany({
//                 where: { academicYearId, isCurrent: true },
//                 data: { isCurrent: false }
//               });
//             }

//             switch(payload.period) { // validate that the term dates fall within the academic year dates
//                 case TermPeriod.FIRST:
//                     payload.startDate = 


      
//             const term = await tx.term.create({
//               data: {
//                 academicYearId,
//                 period: payload.period,
//                 startDate: payload.startDate,
//                 endDate: payload.endDate,
//                 isCurrent: payload.setCurrent ?? false
//               }
//             });
      
//             return term;
//         });
//     }
// };



// ACADEMIC YEAR SERVICE
// ============================================================
 interface AcademicYearType {
    label: string,
    startDate: Date;
    endDate: Date;
    isCurrent: boolean
 }
export const academicYearService = {
    /**
   * Create a new academic year for a school.
   * If isCurrent=true, unsets any existing current year first.
   */
    async createAcademicYear( 
      tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
      schoolId: string,
      {label, startDate, endDate, isCurrent}: AcademicYearType) {
        // Demotes existing current year if setting a new one
        if (isCurrent) {
          await tx.academicYear.updateMany({
            where: { schoolId, isCurrent: true },
            data: { isCurrent: false },
          });
        }
        
        return tx.academicYear.create({
          data: { schoolId, label, startDate, endDate, isCurrent: isCurrent ?? false },
        });
    },
 
    async listAllAcademicYears(schoolId: string) {
      try {
        const years = await prisma.academicYear.findMany({
          where: { schoolId },
          orderBy: { startDate: "desc" },
          include: { terms: { orderBy: { startDate: "asc" } } },
        });
        return NextResponse.json({ data: years });
      } 
      catch (error) {
        console.error("[academicYearService.list]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }
    },
 
    async getAcademicYearById(id: string, schoolId: string) {
      try {
        const year = await prisma.academicYear.findFirst({
          where: { id, schoolId },
          include: { terms: { orderBy: { startDate: "asc" } } },
        });
        if (!year) {
          return NextResponse.json({ error: "Academic year not found." }, { status: 404 });
        }
        return NextResponse.json({ data: year });
      } 
      catch (error) {
        console.error("[academicYearService.getById]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }
    },
 
    async updateAcademicYear(req: NextRequest, id: string, schoolId: string,
      {label, startDate, endDate, isCurrent}: AcademicYearType
    ) {
      try {
        const year = await prisma.academicYear.findFirst({
          where: { id, schoolId },
          select: { id: true },
        });
        if (!year) {
          return NextResponse.json({ error: "Academic year not found." }, { status: 404 });
        }
      
        const updated = await prisma.$transaction(async (tx) => {
          if (isCurrent) {
            await tx.academicYear.updateMany({
              where: { schoolId, isCurrent: true, id: { not: id } },
              data: { isCurrent: false },
            });
          }
          return tx.academicYear.update({ where: { id }, data: {label, startDate,endDate, isCurrent}});
        });
      
        return NextResponse.json({ message: "Academic year updated.", data: updated });
      } 
      catch (error) {
        console.error("[academicYearService.update]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }
    },
 
  /** Returns the current academic year + active term for a school */
    async getCurrentAcademicYear(schoolId: string) {
      try {
        const year = await prisma.academicYear.findFirst({
          where: { schoolId, isCurrent: true },
          include: {
            terms: {
              where: { isCurrent: true },
              take: 1,
            },
          },
        });
        if (!year) {
          return NextResponse.json(
            { error: "No active academic year found." },
            { status: 404 }
          );
        }
        return NextResponse.json({ data: year });
      } 
      catch (error) {
          console.error("[academicYearService.getCurrent]", error);
          return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }
    },
};
 
// ============================================================
// TERM SERVICE
// ============================================================
 interface TermType {
    academicYearId: string;
    period: TermPeriod;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean
 }
export const termService = {
  /**
   * Create a term inside an academic year.
   * Each academic year allows exactly one of FIRST / SECOND / THIRD.
   * If isCurrent=true, existing current term in the same school is unset.
   */
  
    async createTerm(
      tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
      schoolId: string, {
        academicYearId, 
        period, startDate, 
        endDate, 
        isCurrent
    }: TermType) {
      const academicYear = await tx.academicYear.updateMany({
        where: { schoolId, isCurrent: true },
        data:  { isCurrent: false },
      });
      if(!academicYear){
        throw new Error(`Academic year ${academicYearId} not found for school ${schoolId}.`);
      }
    
        // Unique check: one period per academic year
      const existingTerm = await prisma.term.findUnique({
        where: { academicYearId_period: { academicYearId, period } },
        select: { id: true },
      }); 
      if (existingTerm) {
        throw new Error("Term already exist for this academic year!")
      }
    
      if (isCurrent) {
        // Unset any current term across all years of this school
        const allYearIds = await tx.academicYear
          .findMany({ where: { schoolId }, select: { id: true } })
          .then((ys) => ys.map((y) => y.id));
        await tx.term.updateMany({
          where: { academicYearId: { in: allYearIds }, isCurrent: true },
          data: { isCurrent: false },
        });
      }
    
      return tx.term.create({
        data: { academicYearId, period, startDate, endDate, isCurrent: isCurrent ?? false },
      });
  },

 
    async updateTerm(schoolId: string, {
        academicYearId, period, startDate, endDate, isCurrent
    }: TermType) {
      try {
        const termId = await resolveTermByPeriod(schoolId, period, academicYearId).then(t => t.id);
      
        // Confirm term belongs to this school (via academic year)
        const term = await prisma.term.findFirst({
          where: { id: termId, academicYear: { schoolId } },
          select: { id: true, academicYearId: true },
        });
        if (!term) {
          return NextResponse.json({ error: "Term not found." }, { status: 404 });
        }
      
        const updated = await prisma.$transaction(async (tx) => {
          if (isCurrent) {
            const allYearIds = await tx.academicYear
              .findMany({ where: { schoolId }, select: { id: true } })
              .then((ys) => ys.map((y) => y.id));
            
            await tx.term.updateMany({
              where: { academicYearId: { in: allYearIds }, isCurrent: true, id: { not: termId } },
              data: { isCurrent: false },
            });
          }
          return tx.term.update({ where: { id: termId }, data: { academicYearId, period, startDate, endDate, isCurrent } });
        });
        return NextResponse.json({ message: "Term updated.", data: updated });
      } 
      catch (error) {
        console.error("[termService.update]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }
    },
 
    async getTermByAcademicYear(academicYearId: string, schoolId: string) {
      try {
        const year = await prisma.academicYear.findFirst({
           where: { id: academicYearId, schoolId },
           select: { id: true },
        });
        if (!year) {
           return NextResponse.json({ error: "Academic year not found." }, { status: 404 });
        }
  
        const terms = await prisma.term.findMany({
          where: { academicYearId },
          orderBy: { startDate: "asc" },
        });
  
        return NextResponse.json({ data: terms });
      }    
      catch (error) {
        console.error("[termService.getByAcademicYear]", error);
        return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
      }   
    } 
};  




export const enrollmentService = {
  async extractFromEnrollment () {
    
  }
}