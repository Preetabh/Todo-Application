import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'brand',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20',
      icon: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
    },
    brand: {
      button: 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20',
      icon: 'text-brand-500 bg-brand-50 dark:bg-brand-950/40',
    },
    amber: {
      button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
      icon: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
    },
  };

  const style = variantStyles[variant] || variantStyles.brand;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl transition-all">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl shrink-0 ${style.icon}`}>
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center space-x-2 ${style.button}`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
