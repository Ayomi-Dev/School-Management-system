import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { AssignFeeToClassBody, ClassFeeOverviewRow, CreateFeeStructureBody, FeePayment, FeePaymentListResponse, FeeStructure, RecordPaymentBody, StudentFeeStatement, UpdateFeePaymentBody } from "@/src/types/fees";

const client = getApiClient()
export const feeService = {
  listFeeStructures: async (termId: string): Promise<FeeStructure[]> => {
    const res = await client.get(API_ENDPOINTS.LIST_FEE_STRUCTURES(termId));
    return res.data.data;
  },
 
  createFeeStructure: async (body: CreateFeeStructureBody): Promise<FeeStructure> => {
    const res = await client.post(API_ENDPOINTS.CREATE_FEE_STRUCTURE(body.termId), body);
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

  listPayments: async (filters: { termId?: string; search?: string; page?: number; limit?: number }): Promise<FeePaymentListResponse> => {
    const res = await client.get(API_ENDPOINTS.RECORD_PAYMENT(), { params: filters });
    return res.data 
  },

  updatePayment: async (paymentId: string, body: UpdateFeePaymentBody): Promise<FeePayment> => {
    const res = await client.patch(`${API_ENDPOINTS.RECORD_PAYMENT()}?paymentId=${paymentId}`, body);
    return res.data.data;
  },
 
  getStudentStatement: async (
    studentId: string,
    termId: string,
  ): Promise<StudentFeeStatement & { student: { id: string; firstName: string; lastName: string; studentNumber: string; currentClass: { id: string; level: string } | null } }> => {
    const res = await client.get(
      API_ENDPOINTS.GET_STUDENT_STATEMENT(studentId, termId),
    );
    const statement = res.data?.data;
    if (!statement) {
      throw new Error('The student statement response was empty.');
    }
    return statement;
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
