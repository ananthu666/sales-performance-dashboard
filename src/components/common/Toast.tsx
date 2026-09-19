import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  FileDown,
} from 'lucide-react';
import {
  ToastContext,
  type ToastItem,
  type ToastAction,
} from '../../context/ToastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = toast.duration ?? (toast.type === 'error' ? 8000 : 5000);

      const newToast: ToastItem = { ...toast, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const toast = {
    success: (title: string, message: string, action?: ToastAction) =>
      showToast({ type: 'success', title, message, action }),
    error: (title: string, message: string, action?: ToastAction) =>
      showToast({ type: 'error', title, message, action }),
    warning: (title: string, message: string, action?: ToastAction) =>
      showToast({ type: 'warning', title, message, action }),
    info: (title: string, message: string, action?: ToastAction) =>
      showToast({ type: 'info', title, message, action }),
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, toast }}>
      {children}
      {/* Toast Floating Viewport Container */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              t.type === 'success'
                ? 'bg-white border-[#EDC6DD] text-slate-900 shadow-[#631244]/10'
                : t.type === 'error'
                ? 'bg-[#FFF5F7] border-rose-300 text-slate-900 shadow-rose-900/10'
                : t.type === 'warning'
                ? 'bg-[#FDF6F0] border-[#F8CBBA] text-slate-900 shadow-[#DE5829]/10'
                : 'bg-white border-[#EADBDE] text-slate-900 shadow-slate-900/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Type Icon */}
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  t.type === 'success'
                    ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
                    : t.type === 'error'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : t.type === 'warning'
                    ? 'bg-[#FCE7DE] text-[#DE5829] border border-[#F8CBBA]'
                    : 'bg-[#F5EFF2] text-[#631244] border border-[#EADBDE]'
                }`}
              >
                {t.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#631244]" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                ) : t.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-[#DE5829]" />
                ) : (
                  <Info className="w-5 h-5 text-[#631244]" />
                )}
              </div>

              {/* Toast Text Content */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs font-bold tracking-tight text-slate-900">
                  {t.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t.message}
                </p>

                {/* Optional Embedded Action Button */}
                {t.action && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismissToast(t.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors shadow-xs cursor-pointer"
                    >
                      {t.action.icon || <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />}
                      <span>{t.action.label}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};
