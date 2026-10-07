import { feeService } from "@/src/services/client/fees";
import { AssignFeeToClassBody, BursarDashboardSummary, CreateFeeStructureBody, RecordPaymentBody } from "@/src/types/fees";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

export const bursarKeys = {
  dashboard:       (termId?: string) => ['bursar-dashboard',  termId] as const,
  feeStructures:   (termId: string) => ['fee-structures',    termId] as const,
  studentStatement:(studentId: string, termId: string) => ['student-statement', studentId, termId] as const,
  paymentHistory:  (studentId: string) => ['payment-history',   studentId] as const,
  classFeeOverview:(classId: string, termId: string, ayId: string) => ['class-fee-overview', classId, termId, ayId] as const,
} as const;
 
export const useFeeStructures = (termId: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: bursarKeys.feeStructures(termId),
    queryFn: async() => {
      try {
        return await feeService.listFeeStructures(termId)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message)
        return null
      }
    },
    enabled:  !!termId,
  });
}
 
export const useCreateFeeStructureMutation = (termId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: async(body: CreateFeeStructureBody) => {
      try {
        return await feeService.createFeeStructure(body)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return
      queryClient.invalidateQueries({ queryKey: bursarKeys.feeStructures(termId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.dashboard(termId) });
      success('Fee structure created');
    },
  });
};
 
export const useAssignFeeToClassMutation = () => {
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: async({ feeStructureId, body }: { feeStructureId: string; body: AssignFeeToClassBody }) => {
      try {
        return await feeService.assignFeeToClass(feeStructureId, body)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (data) => {
      if(!data) return
      success(`Fee assigned to ${data.count} student(s)`)
    }
  });
};
 
export const useRecordPaymentMutation = (studentId: string, termId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: async(body: RecordPaymentBody) => {
      try {
        return await feeService.recordPayment(body)
      } catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    onSuccess: (payment) => {
      if(!payment) return;
      queryClient.invalidateQueries({ queryKey: bursarKeys.studentStatement(studentId, termId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.paymentHistory(studentId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.dashboard(termId) });
      success(`Payment recorded — Receipt ${payment.receiptNumber}`);
    },
  });
};
 
export const useStudentStatement = (studentId: string, termId: string, enabled = true) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: bursarKeys.studentStatement(studentId, termId),
    queryFn: async() => {
      try {
        return await feeService.getStudentStatement(studentId, termId)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  enabled && !!studentId && !!termId,
  });

}
 
export const usePaymentHistory = (studentId: string, enabled = true) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: bursarKeys.paymentHistory(studentId),
    queryFn: async() => {
      try {
        return await feeService.getPaymentHistory(studentId)
      }
       catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },
    enabled:  enabled && !!studentId,
  });
}
 
export const useClassFeeOverview = (
  classId: string,
  termId: string,
  academicYearId: string,
  enabled = true,
) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: bursarKeys.classFeeOverview(classId, termId, academicYearId),
    queryFn: async() => {
      try {
        return await feeService.getClassFeeOverview(classId, termId, academicYearId)
      } 
      catch (error) {
        const message = getErrorMessage(error);
        showError(message);
        return null;
      }
    },   
    enabled:  enabled && !!classId && !!termId && !!academicYearId,
  });
}
