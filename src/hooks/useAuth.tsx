/**
 * Authentication Hook
 * Manages user session, login, register, logout, and token refresh
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { apiClient, setAuthTokens, getAccessToken, clearAuthTokens, isTokenExpired } from '../api/axios';
import type { User, Session, LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateProfileRequest, AuthTokens } from '../api/contracts';
import { getQueryClient, invalidationHelpers } from '../api/queryClient';

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Context Creation
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ============================================
  // Session Initialization
  // ============================================

  const initializeSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to get session from API
      const response = await apiClient.get<{ data: Session }>('/auth/session');
      const sessionData = response.data.data;

      setSession(sessionData);
      setUser(sessionData.user);
      setAuthTokens({
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresIn: Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000),
      });
    } catch (err) {
      // Token might be expired, try to refresh
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const refreshToken = storedTokens ? JSON.parse(storedTokens).refreshToken : null;
        const response = await apiClient.post<{ data: AuthTokens }>('/auth/refresh', {
          refreshToken,
        });

        const tokens = response.data.data;
        setAuthTokens(tokens);

        // Get user data with new token
        const sessionResponse = await apiClient.get<{ data: Session }>('/auth/session');
        const sessionData = sessionResponse.data.data;

        setSession(sessionData);
        setUser(sessionData.user);
      } catch {
        // Refresh failed, clear tokens
        clearAuthTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // ============================================
  // Token Expiry Check
  // ============================================

  useEffect(() => {
    if (!session) return;

    const checkExpiry = () => {
      if (isTokenExpired({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
      })) {
        refreshSession();
      }
    };

    // Check every minute
    const interval = setInterval(checkExpiry, 60_000);
    return () => clearInterval(interval);
  }, [session]);

  // ============================================
  // Actions
  // ============================================

  const login = async (credentials: LoginRequest) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post<{ data: Session }>('/auth/login', credentials);
      const sessionData = response.data.data;

      setSession(sessionData);
      setUser(sessionData.user);
      setAuthTokens({
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresIn: Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000),
      });

      // Invalidate and refetch user-specific queries
      const queryClient = getQueryClient();
      invalidationHelpers.userSession(queryClient, sessionData.user.id);

      // Return to the flow that required authentication (?redirect=), or home
      const redirectPath = (location.search as { redirect?: string } | undefined)?.redirect;
      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        navigate({ href: redirectPath, replace: true });
      } else {
        navigate({ to: '/', replace: true });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post<{ data: Session }>('/auth/register', data);
      const sessionData = response.data.data;

      setSession(sessionData);
      setUser(sessionData.user);
      setAuthTokens({
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresIn: Math.floor((new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000),
      });

      const queryClient = getQueryClient();
      invalidationHelpers.userSession(queryClient, sessionData.user.id);

      navigate({ to: '/', replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      clearAuthTokens();
      setSession(null);
      setUser(null);
      const queryClient = getQueryClient();
      invalidationHelpers.clearAll(queryClient);
      navigate({ to: '/', replace: true });
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setError(null);

    try {
      await apiClient.post('/auth/change-password', data);
      // Password changed successfully - tokens might be rotated
      await refreshSession();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password';
      setError(message);
      throw err;
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    setError(null);

    try {
      const response = await apiClient.patch<{ data: User }>('/profile', data);
      const updatedUser = response.data.data;

      setUser(updatedUser);
      if (session) {
        setSession({ ...session, user: updatedUser });
      }

      const queryClient = getQueryClient();
      invalidationHelpers.user(queryClient, updatedUser.id);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  const refreshSession = async () => {
    try {
      const response = await apiClient.post<{ data: AuthTokens }>('/auth/refresh', {
        refreshToken: session?.refreshToken,
      });

      const tokens = response.data.data;
      setAuthTokens(tokens);

      // Fetch updated session
      const sessionResponse = await apiClient.get<{ data: Session }>('/auth/session');
      const sessionData = sessionResponse.data.data;

      setSession(sessionData);
      setUser(sessionData.user);
    } catch {
      clearAuthTokens();
      setSession(null);
      setUser(null);
      const queryClient = getQueryClient();
      invalidationHelpers.clearAll(queryClient);
      navigate({ to: '/auth/login', search: { redirect: '/' }, replace: true });
    }
  };

  const clearError = () => setError(null);

  // ============================================
  // Render
  // ============================================

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        changePassword,
        updateProfile,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// Protected Route Helper
// ============================================

export const requireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Let the component render loading state
  }

  if (!isAuthenticated) {
    throw new Error('UNAUTHORIZED');
  }
};

// ============================================
// Optional Auth Helper
// ============================================

export const useOptionalAuth = () => {
  const context = useContext(AuthContext);
  return context;
};