import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-900';
      default:
        return 'border-sky-200 bg-sky-50 text-sky-900';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 min-w-[280px] max-w-md ${getBorderColor()}`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded-lg"
        aria-label="ปิดแจ้งเตือน"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
