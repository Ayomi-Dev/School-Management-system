import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { PaginatedResponse, SaveScoresPayload, ScoreHistoryEntry, ScoreHistoryParams, ScoreRosterResponse, TeacherProfile } from "@/src/types";
import { AssignedClass, AttendanceHistoryEntry, AttendanceHistoryParams, DailyRosterResponse, MarkAttendancePayload, MySubjectsResponse } from "@/src/utils/teacher";



const client = getApiClient();

export const teacherService = {
    get: async (id: string): Promise<PaginatedResponse<TeacherProfile>> => {
        const response = await client.get(API_ENDPOINTS.TEACHERS_GET(id));
        return response.data
    },
    getMyClass: async (): Promise<AssignedClass> => {
        const response = await client.get(API_ENDPOINTS.TEACHER_GET_ME());
        return response.data
    },
    getDailyRoster: async (classId: string, date?: string): Promise<{ data: DailyRosterResponse }> => {
        const response = await  client.get(API_ENDPOINTS.GET_DAILY_ROSTER(classId), { params: date ? { date } : undefined })
        return response.data
    },
   
    markAttendance: async (
      classId: string,
      payload: MarkAttendancePayload,
    ): Promise<{ message: string; data: { updatedCount: number } }> => {
        const response = await client.patch(API_ENDPOINTS.MARK_ATTENDANCE(classId), payload)
        return response.data
    },
    
    getAttendanceHistory: async({
      classId,
      ...params
    }: AttendanceHistoryParams): Promise<{
      data: AttendanceHistoryEntry[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }> => {
        const response = await client.get(API_ENDPOINTS.GET_ATTENDANCE_HISTORY(classId), { params })
        return response.data
    },
    saveScores: async(
        classId: string,
        subjectId: string,
        payload: SaveScoresPayload,
    ): Promise<{ message: string; data: { updated: unknown[] } }> =>
    {
        const response = await client.patch(API_ENDPOINTS.SAVE_SCORES(classId, subjectId), payload)
        return response.data
    },
 
    getScoreHistory: async({
      subjectId,
      ...params
      }: ScoreHistoryParams): Promise<{
        data: ScoreHistoryEntry[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }> => {
         const response = await client.get(API_ENDPOINTS.GET_SCORE_HISTORY(subjectId), { params })
        return response.data
    },
    getScoreRoster: async(
      classId: string,
      subjectId: string, 
      ): Promise<{ data: ScoreRosterResponse }> => {
      const response = await client.get(API_ENDPOINTS.GET_SCORE_ROSTER(classId, subjectId),)
      console.log("get roster")
      return response.data
    },
    getMySubjectsForClass: async(classId: string): Promise<MySubjectsResponse> => {
      const response = await client.get(API_ENDPOINTS.GET_MY_SUBJECTS(classId))
      return response.data  
    }
}

