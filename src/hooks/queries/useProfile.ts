// hooks/queries/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/authStore';
import { useProfileStore } from '@/src/stores/profileStore';
import { profileService } from '@/src/services/client/profile';
import { queryKeys } from '@/src/lib/queryClient';
import { useEffect } from 'react';
import { getErrorMessage } from '@/src/utils/error';

export const useProfileQuery = () => {
  const user = useAuthStore((s) => s.user);
  const { setProfile, setProfileError  } = useProfileStore();
  const query = useQuery({
    queryKey: queryKeys.profile.byRole(user?.role, user?.id),
    queryFn: async () => {
      // Each role hits its own endpoint
      const result = await profileService.getByRole(user!.role, user!.id);
      return result;
    },
    enabled: !!user?.role && !!user?.id, // don't fire until user is known
    });
    
    useEffect(() => {
      if (query.data) setProfile(query.data?.data.data);
    }, [query.data]);

  useEffect(() => {
    if (query.error) {
      const message = getErrorMessage(query.error)
      setProfileError(message)
    };
  }, [query.error]);
    return query 
};