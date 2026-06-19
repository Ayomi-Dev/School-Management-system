import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { PaginatedResponse, TeacherProfile } from "@/src/types";
import { AssignedClass } from "@/src/utils/teacher";



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
}

