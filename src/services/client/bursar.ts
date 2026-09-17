import { API_ENDPOINTS } from "@/src/config/constants";
import { getApiClient } from '@/src/config/api';
import { 
  AssignFeeToClassBody, 
  BursarDashboardSummary, 
  ClassFeeOverviewRow, 
  CreateFeeStructureBody, 
  FeePayment, 
  FeeStructure, 
  RecordPaymentBody, 
  StudentFeeStatement 
} from "@/src/types/fees";


const client = getApiClient()
export const bursarService = {
  getDashboard: async (termId: string): Promise<BursarDashboardSummary> => {
    const res = await client.get(API_ENDPOINTS.GET_DASHBOARD(termId));
    console.log("Dashboard data fetched:", res.data.data);
    return res.data.data;
  },
 
  listFeeStructures: async (termId: string): Promise<FeeStructure[]> => {
    const res = await client.get(API_ENDPOINTS.LIST_FEE_STRUCTURES(termId));
    return res.data.data;
  },
 
  createFeeStructure: async (body: CreateFeeStructureBody): Promise<FeeStructure> => {
    const res = await client.post(API_ENDPOINTS.CREATE_FEE_STRUCTURE(), body);
    return res.data.data;
  },
 
  assignFeeToClass: async (
    feeStructureId: string,
    body: AssignFeeToClassBody,
  ): Promise<{ count: number }> => {
    const res = await client.post(
      API_ENDPOINTS.ASSIGN_FEE_TO_CLASS(feeStructureId),
      body,
    );
    return res.data.data;
  },
 
  recordPayment: async (body: RecordPaymentBody): Promise<FeePayment> => {
    const res = await client.post(API_ENDPOINTS.RECORD_PAYMENT(), body);
    return res.data.data;
  },
 
  getStudentStatement: async (
    studentId: string,
    termId: string,
  ): Promise<StudentFeeStatement & { student: { id: string; firstName: string; lastName: string; studentNumber: string; currentClass: { id: string; level: string } | null } }> => {
    const res = await client.get(
      API_ENDPOINTS.GET_STUDENT_STATEMENT(studentId, termId),
    );
    return res.data.data;
  },
 
  getPaymentHistory: async (studentId: string): Promise<FeePayment[]> => {
    const res = await client.get(API_ENDPOINTS.GET_PAYMENT_HISTORY(studentId));
    return res.data.data;
  },
 
  getClassFeeOverview: async (
    classId: string,
    termId: string,
    academicYearId: string,
  ): Promise<{ classLevel: string; rows: ClassFeeOverviewRow[] }> => {
    const res = await client.get(
      API_ENDPOINTS.GET_CLASS_FEE_OVERVIEW(classId, termId, academicYearId),
    );
    return res.data.data;
  },
};
 