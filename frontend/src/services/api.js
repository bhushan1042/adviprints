import axios from 'axios';
import API_BASE from '../config/env';

const api = axios.create({
  baseURL: API_BASE,
});

const isAuthenticatedRequest = (config) => config?.auth === true;
const usedAdminToken = (config) => config?.__usedAdminToken === true;

const clearAdminSession = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminEmail');
};

const redirectToAdminLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname !== '/admin/login') {
    window.location.assign('/admin/login');
  }
};

const isSafeServerMessage = (value) => {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 140 &&
    !/(stack|exception|trace|<[^>]+>|doctype|mongodb|sql)/i.test(value)
  );
};

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };

  if (isAuthenticatedRequest(nextConfig)) {
    const token = localStorage.getItem('adminToken');

    if (token) {
      nextConfig.headers = nextConfig.headers || {};
      nextConfig.headers.Authorization = `Bearer ${token}`;
      nextConfig.__usedAdminToken = true;
    }
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error?.response?.status === 401 && usedAdminToken(error?.config)) {
      clearAdminSession();
      redirectToAdminLogin();
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
    return 'Request cancelled.';
  }

  const response = error?.response;
  const responseData = response?.data;
  const serverMessage = typeof responseData === 'string'
    ? responseData
    : responseData?.message || responseData?.error;

  if (response) {
    if (response.status === 401) {
      return usedAdminToken(error?.config)
        ? 'Your admin session has expired. Please sign in again.'
        : isSafeServerMessage(serverMessage)
          ? serverMessage.trim()
          : 'Invalid credentials. Please try again.';
    }

    if (response.status === 403) {
      return isAuthenticatedRequest(error?.config)
        ? 'You do not have admin access.'
        : isSafeServerMessage(serverMessage)
          ? serverMessage.trim()
          : 'You do not have permission to do that.';
    }

    if (response.status === 404) {
      return 'The requested resource was not found.';
    }

    if (response.status === 400 || response.status === 409 || response.status === 422) {
      return isSafeServerMessage(serverMessage)
        ? serverMessage.trim()
        : 'Please review the information you entered and try again.';
    }

    if (response.status >= 500) {
      return isSafeServerMessage(serverMessage)
        ? serverMessage.trim()
        : 'The server could not complete your request. Please try again later.';
    }
  }

  if (error?.request) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return isSafeServerMessage(error?.message) ? error.message.trim() : fallback;
};

export const isRequestAborted = (error) => axios.isCancel(error) || error?.code === 'ERR_CANCELED';

export const withAuth = (config = {}) => ({
  ...config,
  auth: true,
});

export { clearAdminSession };

export default api;
