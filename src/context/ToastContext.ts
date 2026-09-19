import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  action?: ToastAction;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (title: string, message: string, action?: ToastAction) => string;
    error: (title: string, message: string, action?: ToastAction) => string;
    warning: (title: string, message: string, action?: ToastAction) => string;
    info: (title: string, message: string, action?: ToastAction) => string;
  };
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
