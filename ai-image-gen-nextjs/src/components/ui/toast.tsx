"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";

type ToastType = {
  id?: string;
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextType = {
  toast: (toast: ToastType) => void;
  toasts: ToastType[];
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = (newToast: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toastWithId = { ...newToast, id };
    setToasts((prev) => [...prev, toastWithId]);

    // Auto-dismiss toast after specified duration or default 3000ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastWithId.id));
    }, newToast.duration || 3000);
  };

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
      {toasts.map((toast: any, i: number) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md border border-gray-200 dark:border-gray-700"
        >
          <div className="font-medium">{toast.title}</div>
          {toast.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {toast.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 