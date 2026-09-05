import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { LinkedStudent, ParentReportCard, ParentStudentSummary } from "@/src/types/parent";

export const parentService = {
  getLinkedStudents: async (): Promise<LinkedStudent[]> => {
    const res = await getApiClient().get(API_ENDPOINTS.GET_LINKED_STUDENTS());
    return res.data.data;
  },
 
  getStudentSummary: async (
    studentId: string,
    termId?:   string,
  ): Promise<ParentStudentSummary> => {
    const res = await getApiClient().get(
      API_ENDPOINTS.GET_STUDENT_SUMMARY(studentId),
      { params: termId ? { termId } : undefined },
    );
    return res.data.data; 
  },
 
  getStudentReportCard: async (reportCardId: string): Promise<ParentReportCard> => {
    const res = await getApiClient().get(
      API_ENDPOINTS.GET_STUDENT_REPORT_CARD(reportCardId),
    );
    return res.data.data;
  },
};