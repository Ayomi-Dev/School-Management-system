import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementClient } from '@/src/services/client/announcement';
import { useToast } from '@/src/hooks/useToast';
import { getErrorMessage } from '@/src/utils/error';

export const announcementKeys = {
  admin: ['announcements', 'admin'] as const,
  dashboard: ['announcements', 'dashboard'] as const,
};

export const useAdminAnnouncements = () => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: announcementKeys.admin,
    queryFn: async() => {
      try{
        return await announcementClient.listForAdmin()
      }
      catch(error){
        const message = getErrorMessage(error)
        showError(message)
        return null
      }
    }
  });
}

export const useDashboardAnnouncements = () => {
  const { error: showError } = useToast()
  return useQuery({
    queryKey: announcementKeys.dashboard,
    queryFn: async() =>{
      try{
        return await announcementClient.listForDashboard()
      }
      catch(error){
        const message = getErrorMessage(error)
        showError(message)
        return null
      }
    },
    staleTime: 30_000,
  })
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  return useMutation({
    mutationFn: announcementClient.create,
    onSuccess: async (response) => {
      success(response.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: announcementKeys.admin }),
        queryClient.invalidateQueries({ queryKey: announcementKeys.dashboard }),
      ]);
    },
    onError: (error) => showError(getErrorMessage(error)),
  });
};
