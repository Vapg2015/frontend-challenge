/**
 * Axios Instance Configuration
 * Centralized HTTP client with interceptors for auth, error handling, and request/response transformation
 */

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError, AuthTokens, ApiResponse } from './contracts';
import { generateIdempotencyKey } from '../utils/idempotency';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_TIMEOUT = 30000;

// ============================================
// Token Management
// ============================================

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenRefreshPromise: Promise<AuthTokens> | null = null;

export const setAuthTokens = (tokens: AuthTokens) => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }
};

export const getAccessToken = (): string | null => {
  if (!accessToken && typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      try {
        const tokens: AuthTokens = JSON.parse(stored);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      } catch {
        // Invalid stored tokens
      }
    }
  }
  return accessToken;
};

export const getRefreshToken = (): string | null => {
  if (!refreshToken && typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      try {
        const tokens: AuthTokens = JSON.parse(stored);
        refreshToken = tokens.refreshToken;
      } catch {
        // Invalid stored tokens
      }
    }
  }
  return refreshToken;
};

export const clearAuthTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_tokens');
  }
};

export const isTokenExpired = (tokens: AuthTokens): boolean => {
  const expiryTime = Date.now() + tokens.expiresIn * 1000;
  return Date.now() >= expiryTime - 60000; // Refresh 1 minute before expiry
};

// Request metadata store for timing
const requestMetadata = new WeakMap<InternalAxiosRequestConfig, { startTime: number }>();

// ============================================
// Axios Instance Creation
// ============================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
  });

  // ============================================
  // Request Interceptor
  // ============================================
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add idempotency key for mutations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const idempotencyKey = generateIdempotencyKey();
        config.headers['Idempotency-Key'] = idempotencyKey;
      }

      // Add request timestamp for debugging
      requestMetadata.set(config, { startTime: Date.now() });

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ============================================
  // Response Interceptor
  // ============================================
  client.interceptors.response.use(
    (response) => {
      // Log response time in development
      if (import.meta.env.DEV) {
        const metadata = requestMetadata.get(response.config);
        if (metadata?.startTime) {
          const duration = Date.now() - metadata.startTime;
          console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }
      }
      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newTokens = await refreshAccessToken();
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
          }
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 - Forbidden
      if (error.response?.status === 403) {
        console.error('[API] Access forbidden:', error.response.data);
      }

      // Handle 404 - Not Found
      if (error.response?.status === 404) {
        console.error('[API] Resource not found:', error.config?.url);
      }

      // Handle 409 - Conflict (e.g., duplicate order, availability)
      if (error.response?.status === 409) {
        console.error('[API] Conflict:', error.response.data);
      }

      // Handle 422 - Validation Error
      if (error.response?.status === 422) {
        console.error('[API] Validation error:', error.response.data);
      }

      // Handle 5xx - Server Error
      if (error.response && error.response.status >= 500) {
        console.error('[API] Server error:', error.response.status, error.response.data);
      }

      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          console.error('[API] Request timeout:', error.config?.url);
        } else if (error.code === 'ERR_NETWORK') {
          console.error('[API] Network error:', error.message);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// ============================================
// Token Refresh
// ============================================

const refreshAccessToken = async (): Promise<AuthTokens> => {
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  tokenRefreshPromise = (async () => {
    const response = await axios.post<ApiResponse<AuthTokens>>(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: currentRefreshToken,
    });

    const tokens = response.data.data;
    setAuthTokens(tokens);
    return tokens;
  })();

  try {
    return await tokenRefreshPromise;
  } finally {
    tokenRefreshPromise = null;
  }
};

// ============================================
// Export Instance
// ============================================

export const apiClient = createApiClient();

// ============================================
// Helper Functions for Common Requests
// ============================================

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<ApiResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<ApiResponse<T>>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<ApiResponse<T>>(url, config).then((res) => res.data),
};

// ============================================
// WebSocket URL Helper
// ============================================

export const getWebSocketUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // Default namespace "/" on the engine.io path (/socket.io/). VITE_WS_URL overrides it.
  return import.meta.env.VITE_WS_URL || `${protocol}//${host}`;
};