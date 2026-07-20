import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/src/hooks/useToast';
import { schoolBrandingService } from '@/src/services/client/branding';
import { UpdateSchoolBrandingBody } from '@/src/types/branding';
 
export const brandingKeys = {
  branding: () => ['school-branding'] as const,
} as const;
 
// Returns the school's branding — consumed by settings page AND layouts.
// staleTime is 5 minutes: branding rarely changes, no need to refetch on
// every navigation.
export const useSchoolBranding = () =>
  useQuery({
    queryKey: brandingKeys.branding(),
    queryFn:  () => schoolBrandingService.getBranding(),
    staleTime: 5 * 60 * 1000,
  });
 
export const useUpdateSchoolBrandingMutation = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: (body: UpdateSchoolBrandingBody) =>
      schoolBrandingService.updateBranding(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandingKeys.branding() });
      success('School branding saved');
    },
    onError: () => error('Failed to save branding'),
  });
};
 
// Logo/favicon upload — two-step:
//   1. Get presigned URL
//   2. PUT file to storage
//   3. PATCH branding with the public URL
// Returns the public URL so the caller can immediately update local preview state.
export const useLogoUploadMutation = () => {
  const queryClient  = useQueryClient();
  const { success, error } = useToast();
 
  return useMutation({
    mutationFn: async ({
      file,
      uploadFor,
    }: {
      file:      File;
      uploadFor: 'logo' | 'favicon';
    }) => {
      const { uploadUrl, publicUrl } =
        await schoolBrandingService.getLogoUploadUrl(file.name, file.type, uploadFor);
 
      await schoolBrandingService.uploadFileToPresignedUrl(uploadUrl, file);
 
      // Persist the public URL to the branding record
      await schoolBrandingService.updateBranding(
        uploadFor === 'logo' ? { logoUrl: publicUrl } : { faviconUrl: publicUrl },
      );
 
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandingKeys.branding() });
      success('Image uploaded successfully');
    },
    onError: () => error('Failed to upload image'),
  });
};