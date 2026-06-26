import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { ReportCardDetail, ReportCardListResponse } from "@/src/types";

 const client = getApiClient()
export const reportCardService = {
 
  getReportCardList: async(classId: string): Promise<ReportCardListResponse> => {
    const response = await  client.get(API_ENDPOINTS.GET_REPORT_CARDS(classId))
    return response.data
  },
 
  getReportCard: (
    classId: string,
    reportCardId: string,
  ): Promise<{ data: ReportCardDetail }> =>
    client
      .get(API_ENDPOINTS.GET_SINGLE_REPORT_CARD(classId, reportCardId))
      .then((r) => r.data),
 
  compileReportCard: (
    classId: string,
    studentId: string,
  ): Promise<{ message: string; data: any }> =>
    client
      .post(API_ENDPOINTS.COMPILE_REPORT_CARDS(classId), { studentId })
      .then((r) => r.data),
 
  updateReportCardRemark: (
    classId: string,
    reportCardId: string,
    teacherRemark: string,
  ): Promise<{ message: string; data: any }> =>
    client
      .patch(API_ENDPOINTS.UPDATE_REPORT_CARD(classId, reportCardId), {
        action: 'remark',
        teacherRemark,
      })
      .then((r) => r.data),
 
  publishReportCard: (
    classId: string,
    reportCardId: string,
  ): Promise<{ message: string; data: any }> =>
    client
      .patch(API_ENDPOINTS.PUBLISH_REPORT_CARD(classId, reportCardId), {
        action: 'publish',
      })
      .then((r) => r.data),
};