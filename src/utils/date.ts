import { TermPeriod } from "../types/types";

export const createSessionDate = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth()+1
    const currentAcademicYearStart = (month <= 7 ? year-1 : year ).toString()
    const currentAcademicYearEnd = (month <= 7 ? year : year + 1 ).toString()

    return {currentAcademicYearStart, currentAcademicYearEnd}
}
