import axios from 'axios';

export const DEFAULT_BACKEND_URL = 'https://college-erp-backend-hj58.onrender.com';

export const getApiBaseUrl = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('erp_api_url') : null;
  const isRenderDeploy = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
  const rawUrl = customUrl || import.meta.env.VITE_API_URL || (isRenderDeploy ? DEFAULT_BACKEND_URL : null);
  if (!rawUrl) return '/api';
  const withProtocol = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`;
  return `${withProtocol.replace(/\/$/, '')}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('erp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If the server returned HTML (static site rewrite catch-all), treat as error
    const contentType = response.headers['content-type'] || '';
    if (
      typeof response.data === 'string' &&
      (contentType.includes('text/html') || response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html'))
    ) {
      const error = new Error('Backend API not reached. Frontend is receiving static HTML instead of JSON API.');
      error.isHtmlResponse = true;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
