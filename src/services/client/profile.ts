import { createApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";

// services/client/profile.ts
export const profileService = {
  getByRole: (role: string, userId: string) => {
    const endpoints: Record<string, string> = {
      STUDENT: API_ENDPOINTS.STUDENTS_GET(userId),
      TEACHER: API_ENDPOINTS.TEACHERS_GET(userId),
      BURSAR:  API_ENDPOINTS.BURSAR_GET(userId),
      PARENT:  API_ENDPOINTS.PARENTS_GET(userId),
      ADMIN:  API_ENDPOINTS.GET_ADMIN_PROFILE(userId)
    };
    const url = endpoints[role];
    if (!url) throw new Error(`No profile endpoint for role: ${role}`);
    return createApiClient().get(url); // your existing axios instance
  }
}; 