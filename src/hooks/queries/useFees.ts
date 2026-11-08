import { feeService } from "@/src/services/client/fees";
import { AssignFeeToClassBody, BursarDashboardSummary, CreateFeeStructureBody, RecordPaymentBody, UpdateFeePaymentBody } from "@/src/types/fees";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

export const bursarKeys = {
  dashboard:       (termId?: string) => ['bursar-dashboard',  termId] as const,
  feeStructures:   (termId: string) => ['fee-structures',    termId] as const,
  studentStatement:(studentId: string, termId: string) => ['student-statement', studentId, termId] as const,
  paymentHistory:  (studentId: string) => ['payment-history',   studentId] as const,
  payments:        (filters?: { termId?: string; search?: string; page?: number }) => ['fee-payments', filters] as const,
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
    mutationFn: (body: CreateFeeStructureBody) => feeService.createFeeStructure(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bursarKeys.feeStructures(termId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.dashboard(termId) });
      success('Fee structure created');
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};
 
export const useAssignFeeToClassMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: ({ feeStructureId, body }: { feeStructureId: string; body: AssignFeeToClassBody }) => feeService.assignFeeToClass(feeStructureId, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class-fee-overview'] });
      queryClient.invalidateQueries({ queryKey: ['bursar-dashboard'] });
      success(`Fee assigned to ${data.count} student(s)`)
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};
 
export const useRecordPaymentMutation = (studentId: string, termId: string) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: (body: RecordPaymentBody) => feeService.recordPayment(body),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: bursarKeys.studentStatement(studentId, termId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.paymentHistory(studentId) });
      queryClient.invalidateQueries({ queryKey: bursarKeys.dashboard(termId) });
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      success(`Payment recorded — Receipt ${payment.receiptNumber}`);
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};

export const useFeePayments = (filters: { termId?: string; search?: string; page?: number; limit?: number }, enabled = true) => {
  const { error: showError } = useToast();
  return useQuery({
    queryKey: bursarKeys.payments(filters),
    queryFn: async () => {
      try {
        return await feeService.listPayments(filters);
      } catch (error) {
        showError(getErrorMessage(error));
        throw error;
      }
    },
    enabled: enabled && Boolean(filters.termId),
    staleTime: 15_000,
  });
};

export const useUpdateFeePaymentMutation = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: ({ paymentId, body }: { paymentId: string; body: UpdateFeePaymentBody }) => feeService.updatePayment(paymentId, body),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['student-statement', payment.studentId] });
      queryClient.invalidateQueries({ queryKey: bursarKeys.paymentHistory(payment.studentId) });
      queryClient.invalidateQueries({ queryKey: ['bursar-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['class-fee-overview'] });
      success(`Payment ${payment.receiptNumber} updated`);
    },
    onError: (error) => showError(getErrorMessage(error)),
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
        throw error;
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
        throw error;
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
