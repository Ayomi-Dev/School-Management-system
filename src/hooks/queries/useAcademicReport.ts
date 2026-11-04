import { useQuery } from "@tanstack/react-query";
import { AcademicReportFilters, academicReportClientService } from "@/src/services/client/academicReport";
import { getErrorMessage } from "@/src/utils/error";
import { useToast } from "../useToast";

export const academicReportKeys = {
  all: ["academicReport"] as const,
  report: (filters: AcademicReportFilters) => [...academicReportKeys.all, filters] as const,
};

export const useAcademicReport = (filters: AcademicReportFilters) => {
  const { error: shoErrorMessage } = useToast()
  return useQuery({
    queryKey: academicReportKeys.report(filters),
    queryFn: async () => {
      try{
        return await academicReportClientService.get(filters)}
      catch (error) {
        const message = getErrorMessage(error)
        shoErrorMessage(message)
        return null;
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

}
