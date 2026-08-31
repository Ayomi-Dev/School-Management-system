import { ERROR_MESSAGES } from "../config/constants";

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;

    if (typeof candidate.error === 'string') return candidate.error;
    if (typeof candidate.message === 'string') return candidate.message;

    const response = candidate.response;
    if (response && typeof response === 'object') {
      const responseData = (response as { data?: unknown }).data;
      if (responseData && typeof responseData === 'object') {
        const responsePayload = responseData as Record<string, unknown>;
        if (typeof responsePayload.error === 'string') return responsePayload.error;
        if (typeof responsePayload.message === 'string') return responsePayload.message;
      }
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};