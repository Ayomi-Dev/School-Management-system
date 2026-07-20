import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { ClassTeacher, ClassTimetable, CreateTimetableSlotBody, CreateTimetableSlotResponse, UpdateTimetableSlotBody, UpdateTimetableSlotResponse } from "@/src/types/timetable";

const client = getApiClient();

export const timetableService = {
  getTimetable: async (classId: string): Promise<ClassTimetable> => {
    const res = await client.get(API_ENDPOINTS.GET_TIMETABLE(classId));
    return res.data.data;
  },
 
  getClassTeachers: async (classId: string): Promise<ClassTeacher[]> => {
    const res = await client.get(API_ENDPOINTS.GET_CLASS_TEACHERS(classId));
    return res.data.data;
  },
 
  createSlot: async (
    classId: string,
    body: CreateTimetableSlotBody,
  ): Promise<CreateTimetableSlotResponse> => {
    const res = await client.post(
      API_ENDPOINTS.CREATE_SLOT(classId),
      body,
    );
    return res.data;
  },
 
  updateSlot: async (
    classId: string,
    slotId:  string,
    body:    UpdateTimetableSlotBody,
  ): Promise<UpdateTimetableSlotResponse> => {
    const res = await client.patch(
      API_ENDPOINTS.UPDATE_SLOT(classId, slotId),
      body,
    );
    return res.data;
  },
 
  deleteSlot: async (classId: string, slotId: string): Promise<void> => {
    await client.delete(API_ENDPOINTS.DELETE_SLOT(classId, slotId));
  },
};