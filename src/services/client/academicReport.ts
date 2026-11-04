import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { AcademicReportResponse } from "@/src/types/academicReport";

const client = getApiClient();

export interface AcademicReportFilters {
  academicYearId?: string;
  termId?: string;
  classId?: string;
}

export const academicReportClientService = {
  async get(filters: AcademicReportFilters): Promise<AcademicReportResponse> {
    const params = new URLSearchParams();
    if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
    if (filters.termId) params.set("termId", filters.termId);
    if (filters.classId) params.set("classId", filters.classId);
    const response = await client.get(`${API_ENDPOINTS.ADMIN_ACADEMIC_REPORT}?${params.toString()}`);
    return response.data.data;
  },
};
