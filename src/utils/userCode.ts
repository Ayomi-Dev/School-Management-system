import { prisma } from "../lib/prisma/client";
import { Role, TermPeriod } from "@/app/generated/prisma/enums";




export const currentSession = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth()+1
  const yearBeginning = year.toString()
  const yearBefore = (year - 1).toString();
  const yearEnding = (year + 1).toString()

  if(month >= 8) { // if it's august or later, we're in the new academic session that starts this year and ends next year
    return `${yearBeginning}/${yearEnding}`
  }

  
  return `${yearBefore}/${yearBeginning}`; //formats the session as "24/25"
};

export const getCurrentTerm = ():TermPeriod => {
  const month = new Date().getMonth() + 1;

  if (month <= 4) return TermPeriod.SECOND; //
  if (month <= 8) return TermPeriod.THIRD; // may to august is third term
  return TermPeriod.FIRST; // september to december is first term of the next session
};

export const getCurrentTermSpan = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1 - 12
  const year = now.getFullYear();

  let startDate: Date;
  let endDate: Date;

  if (month >= 8 && month <= 11) {
    // FIRST TERM (Sep - Dec)

    startDate = new Date(year, 8, 1); // Sept 1
    endDate = new Date(year, 11, 31); // Dec 31
  } 
  else if (month >=0 && month <= 3) {
    // SECOND TERM (Jan - Apr)

    startDate = new Date(year, 0, 1); // Jan 1
    endDate = new Date(year, 3, 30); // Apr 30
  } 
  else {
    // THIRD TERM (May - July)
    startDate = new Date(year, 3, 30); // May 1
    endDate = new Date(year, 6, 31); // July 31
  }

  return {
    startDate,
    endDate
  };
};


async function nextSequence( tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  {
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
}

export const generateUserCode = async (
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  role: Role, 
  schoolId: string,
): Promise<string> => { // Generates a unique code based on role, school, year, and term whenever a new user is created by the admin
  const year = new Date().getFullYear();
  const session = currentSession().split("/");
  const start = session[0].slice(2)
  const end = session[1].slice(2)
  const academicSession = `${start}/${end}`
  const term = getCurrentTerm();

  const sequence = await nextSequence(tx, {schoolId, type: role, year, term,});

  const termMap: Record<typeof term, string> = {
   [TermPeriod.FIRST]: "T1",
    [TermPeriod.SECOND]: "T2",
    [TermPeriod.THIRD]: "T3",
  }

  const codePrefixes = {
    STUDENT: "STU",
    TEACHER: "TUT",
    ADMIN: "ADM",
    PARENT: "PAR",
    BURSAR: "BUR"
  };
  
  switch (role) { 
    case "STUDENT": {
      // Zero-pad to 4 digits: 0001, 0042, 1000
      return `${codePrefixes[role]}-${academicSession}/${termMap[term]}/${String(sequence).padStart(4, "0")}`;
    }
    case "TEACHER": {}
    case "PARENT": 
    case "ADMIN": 
    case "BURSAR": {
      return `${codePrefixes[role]}-${academicSession}-${String(sequence).padStart(3, "0")}`;}
    default:
      throw new Error("Invalid role for code generation");
  }
};

