import { API_ENDPOINTS } from "@/src/config/constants";
import { getApiClient } from '@/src/config/api';
import { 
  BursarDashboardSummary
} from "@/src/types/fees";


const client = getApiClient()
export const bursarService = {
  getDashboard: async (termId: string): Promise<BursarDashboardSummary> => {
    const res = await client.get(API_ENDPOINTS.GET_DASHBOARD(termId));
    return res.data.data;
  },

  getStudentsList: async (termId: string, classId: string) => {
    const params = new URLSearchParams({ termId });
      if (classId) params.set('classId', classId);
      const res = await client.get(`/bursar/students?${params.toString()}`);
      return res.data.data ?? [];
  }

};
 