"use client";

import React, { useEffect } from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/**
 * Procedural toast launcher that can be imported and invoked anywhere, 
 * including inside API handlers, custom hooks, and utility files.
 */
export const toast = {
  success: (msg: string, duration?: number) =>
    useToastStore.getState().addToast(msg, "success", duration),
  error: (msg: string, duration?: number) =>
    useToastStore.getState().addToast(msg, "error", duration),
  info: (msg: string, duration?: number) =>
    useToastStore.getState().addToast(msg, "info", duration),
  warning: (msg: string, duration?: number) =>
    useToastStore.getState().addToast(msg, "warning", duration),
};

export const useToast = () => {
  const { toasts, removeToast } = useToastStore();
  return { toasts, removeToast, toast };
};

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  const bgStyles = {
    success: "border-emerald-500/20 bg-emerald-500/5 text-foreground",
    error: "border-rose-500/20 bg-rose-500/5 text-foreground",
    warning: "border-amber-500/20 bg-amber-500/5 text-foreground",
    info: "border-sky-500/20 bg-sky-500/5 text-foreground",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 w-full p-4 rounded-lg border shadow-lg glass-panel transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-40",
        bgStyles[toast.type]
      )}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium leading-normal">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
