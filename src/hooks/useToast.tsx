/**
 * Toast Hook
 * Manages toast notifications state
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { ToastProps } from '@/components/ui/toast';

// ============================================
// Types
// ============================================

interface Toast extends ToastProps {
  id: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextType | null>(null);

// ============================================
// Provider
// ============================================

interface ToastProviderProps {
  children: ReactNode;
}

let emitToast: ((props: Omit<Toast, 'id'>) => string) | null = null;

/** Imperative helpers for code outside the React tree (mutation callbacks, socket handlers). */
export const toastHelpers = {
  success: (title: string, description?: string) => emitToast?.({ variant: 'success', title, description }),
  error: (title: string, description?: string) => emitToast?.({ variant: 'error', title, description }),
  info: (title: string, description?: string) => emitToast?.({ variant: 'info', title, description }),
  warning: (title: string, description?: string) => emitToast?.({ variant: 'warning', title, description }),
};

export function ToastProviderComponent({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    emitToast = toast;
    return () => {
      if (emitToast === toast) emitToast = null;
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}