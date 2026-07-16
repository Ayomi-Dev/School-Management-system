import { getApiClient } from "@/src/config/api";
import { API_ENDPOINTS } from "@/src/config/constants";
import { LogoUploadUrlResponse, SchoolBrandingWithMeta, UpdateSchoolBrandingBody, UpdateSchoolBrandingResponse } from "@/src/types/branding";

const client = getApiClient();
export const schoolBrandingService = {
  getBranding: async (): Promise<SchoolBrandingWithMeta> => {
    const res = await client.get(API_ENDPOINTS.GET_SCHOOL_BRANDING());
    return res.data.data;
  },
 
  updateBranding: async (
    body: UpdateSchoolBrandingBody,
  ): Promise<UpdateSchoolBrandingResponse> => {
    const res = await client.patch(
      API_ENDPOINTS.UPDATE_SCHOOL_BRANDING(),
      body,
    );
    return res.data;
  },
 
  getLogoUploadUrl: async (
    filename:  string,
    mimeType:  string,
    uploadFor: 'logo' | 'favicon',
  ): Promise<LogoUploadUrlResponse> => {
    const res = await client.post(
      API_ENDPOINTS.GET_LOGO_UPLOAD_URL(),
      { filename, mimeType, uploadFor },
    );
    return res.data.data;
  },
 
  // Uploads a file directly to the presigned URL — no auth headers needed,
  // this goes straight to S3/R2, not your API.
  uploadFileToPresignedUrl: async (
    uploadUrl: string,
    file:      File,
  ): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method:  'PUT',
      body:    file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }
  },
};