import { BursarDashboardSummary } from "@/src/types/fees";
import { useQuery } from "@tanstack/react-query";
import { bursarKeys } from "./useFees";
import { bursarService } from "@/src/services/client/bursar";
import { useToast } from "../useToast";
import { getErrorMessage } from "@/src/utils/error";

export const useBursarDashboard = (termId: string) => {
    const { error: showError } = useToast();
    return useQuery({
        queryKey: bursarKeys.dashboard(termId),
        queryFn: async() => {
            try {
                return await bursarService.getDashboard(termId)
            } 
            catch (error) {
                const message = getErrorMessage(error)
                showError(message);
                return null
            }
        },
        enabled:  !!termId,
    });
}

