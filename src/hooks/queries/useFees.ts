import { bursarService } from "@/src/services/client/bursar";
import { AssignFeeToClassBody, BursarDashboardSummary, CreateFeeStructureBody, RecordPaymentBody } from "@/src/types/fees";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

export const bursarKeys = {
  dashboard:       (termId?: string) => ['bursar-dashboard',  termId] as const,
  feeStructures:   (termId: string) => ['fee-structures',    termId] as const,
  studentStatement:(studentId: string, termId: string) => ['student-statement', studentId, termId] as const,
  paymentHistory:  (studentId: string) => ['payment-history',   studentId]                as const,
  classFeeOverview:(classId: string, termId: string, ayId: string) => ['class-fee-overview', classId, termId, ayId] as const,
} as const;
 
export const useFeeStructures = (termId: string) => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: bursarKeys.feeStructures(termId),
    queryFn: async() => {
      try {
        return await bursarService.listFeeStructures(termId)
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
        return await bursarService.createFeeStructure(body)
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
        return await bursarService.assignFeeToClass(feeStructureId, body)
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
        return await bursarService.recordPayment(body)
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
  useQuery({
    queryKey: bursarKeys.studentStatement(studentId, termId),
    queryFn: async() => {
      try {
        return await bursarService.getStudentStatement(studentId, termId)
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
  useQuery({
    queryKey: bursarKeys.paymentHistory(studentId),
    queryFn: async() => {
      try {
        return await bursarService.getPaymentHistory(studentId)
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
  useQuery({
    queryKey: bursarKeys.classFeeOverview(classId, termId, academicYearId),
    queryFn: async() => {
      try {
        return await bursarService.getClassFeeOverview(classId, termId, academicYearId)
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
