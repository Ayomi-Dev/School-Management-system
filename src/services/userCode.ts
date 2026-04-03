import { prisma } from "../lib/prisma/client";
import { Role, TermPeriod } from "@/app/generated/prisma/enums";


export const getAcademicSession = () => {
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`; //formats the session as "2024/2025"
};

export const getCurrentTerm = ():TermPeriod => {
  const month = new Date().getMonth() + 1;

  if (month <= 4) return TermPeriod.SECOND; //
  if (month <= 8) return TermPeriod.THIRD; // may to august is third term
  return TermPeriod.FIRST; // september to december is first term of the next session
};


async function nextSequence({
  schoolId,
  type,
  year,
  term,
}: {
  schoolId: string;
  type: string;
  year: number;
  term: TermPeriod;
}): Promise<number> {
    return await prisma.$transaction( async (tx) => {
      const counter = await tx.codeCounter.upsert({
        where: {
          schoolId_type_year_term: {
            schoolId,
            type,
            year,
            term,
          },
        },
        update: {
          value: { increment: 1 },
        },
        create: {
          schoolId,
          type,
          year,
          term,
          value: 1,
        },
      });
        return counter.value;
    })
}

export const generateUserCode = async (role: Role, schoolId: string,
): Promise<string> => { // Generates a unique code based on role, school, year, and term whenever a new user is created by the admin
  const year = new Date().getFullYear();
  const academicSession = getAcademicSession();
  const term = getCurrentTerm();

  const sequence = await nextSequence( {
    schoolId,
    type: role,
    year,
    term,
  });

  const termMap: Record<typeof term, string> = {
   [TermPeriod.FIRST]: "T1",
    [TermPeriod.SECOND]: "T2",
    [TermPeriod.THIRD]: "T3",
  }

  const codePrefixes = {
    STUDENT: "STU",
    TUTOR: "TUT",
    ADMIN: "ADM",
    PARENT: "PAR"
  };
  
  switch (role) {
    case "STUDENT": {
      
      // Zero-pad to 4 digits: 0001, 0042, 1000
      return `${codePrefixes[role]}-${academicSession}/${termMap[term]}/${String(sequence).padStart(4, "0")}`;
    }
 
    case "TUTOR": {
      return `${codePrefixes[role]}-${academicSession}-${String(sequence).padStart(3, "0")}`;
    }
  
    case "PARENT": {
      return `${codePrefixes[role]}-${academicSession}-${String(sequence).padStart(3, "0")}`;
    }
 
    case "ADMIN": {
      
      return `${codePrefixes[role]}-${academicSession}-${String(sequence).padStart(3, "0")}`;
    }
    default:
      throw new Error("Invalid role for code generation");
  }
};