import { getApiClient } from '@/src/config/api';
import { API_ENDPOINTS } from '@/src/config/constants';
import type { AnnouncementItem } from '@/src/types/announcement';

const client = getApiClient();

export const announcementClient = {
  listForAdmin: async (): Promise<AnnouncementItem[]> => {
    const response = await client.get(API_ENDPOINTS.ADMIN_ANNOUNCEMENTS);
    return response.data.data;
  },
  create: async (body: { title: string; body: string }): Promise<{ message: string; data: AnnouncementItem }> => {
    const response = await client.post(API_ENDPOINTS.ADMIN_ANNOUNCEMENTS, body);
    return response.data;
  },
  listForDashboard: async (): Promise<AnnouncementItem[]> => {
    const response = await client.get(API_ENDPOINTS.DASHBOARD_ANNOUNCEMENTS);
    return response.data.data;
  },
};
