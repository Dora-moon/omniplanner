// src/ui/Toast.tsx
// Global Toast notification system for success and error feedback (Requirement B.1).

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  code?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;
let toastQueue: ToastItem[] = [];
let listeners: ToastListener[] = [];

function notify() {
  listeners.forEach((l) => l([...toastQueue]));
}

export const toast = {
  show: (item: Omit<ToastItem, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { ...item, id };
    toastQueue = [...toastQueue, newToast];
    notify();

    const duration = item.duration ?? (item.type === 'error' ? 5000 : 3500);
    setTimeout(() => {
      toast.dismiss(id);
    }, duration);
    return id;
  },
  success: (message: string): string => {
    return toast.show({ type: 'success', message });
  },
  error: (message: string, code?: string): string => {
    return toast.show({ type: 'error', message, code });
  },
  info: (message: string): string => {
    return toast.show({ type: 'info', message });
  },
  dismiss: (id: string): void => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    notify();
  },
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleUpdate = (newList: ToastItem[]) => setItems(newList);
    listeners.push(handleUpdate);
    setItems([...toastQueue]);
    return () => {
      listeners = listeners.filter((l) => l !== handleUpdate);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in ${
            item.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-950/30'
              : item.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/30'
              : 'bg-stone-900/95 border-stone-700/50 text-stone-100 shadow-stone-950/30'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {item.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-400" />
            ) : item.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <Info size={18} className="text-sky-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {item.code && (
              <div className="mb-1">
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-500/25 text-rose-200 border border-rose-500/40">
                  {item.code}
                </span>
              </div>
            )}
            <p className="text-xs font-medium leading-relaxed break-words">
              {item.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(item.id)}
            className="flex-shrink-0 text-white/50 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
