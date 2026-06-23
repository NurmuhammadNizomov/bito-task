import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { toaster } from './toaster';

declare module 'axios' {
  // Opt a request out of the global error toast so the caller can render the failure inline.
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface ApiResponseData {
  messageKey?: string;
  message?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
  success?: boolean;
}

function translate(data: ApiResponseData | undefined): string {
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(', ');
  return '';
}

const SILENT_SUCCESS_KEYS = new Set([
  'auth.refreshSuccess',
  'auth.loginSuccess',
  'auth.logoutSuccess',
  'auth.registerSuccess',
]);
const SILENT_SUCCESS_URLS = ['/auth/refresh', '/auth/login', '/auth/logout'];

api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponseData;
    const url = response.config.url ?? '';
    const isSilent =
      SILENT_SUCCESS_KEYS.has(data?.messageKey ?? '') ||
      SILENT_SUCCESS_URLS.some((u) => url.includes(u));
    if (response.config.method !== 'get' && !isSilent) {
      const title = translate(data);
      if (title) toaster.create({ title, type: 'success' });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
    const isLoginEndpoint = originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh')
          .then((res) => {
            const newToken = res.data.data.accessToken;
            setAccessToken(newToken);
            return newToken;
          })
          .catch(() => {
            setAccessToken(null);
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    const isSilentFailure =
      isRefreshEndpoint ||
      (error.response?.status === 401 && originalRequest._retry) ||
      originalRequest.skipErrorToast === true;
    if (!isSilentFailure) {
      const data = error.response?.data as ApiResponseData | undefined;
      const title = translate(data) || (error.message === 'Network Error' ? 'Network error' : 'An error occurred');
      toaster.create({ title, type: 'error' });
    }

    if (isRefreshEndpoint || (error.response?.status === 401 && isLoginEndpoint)) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
