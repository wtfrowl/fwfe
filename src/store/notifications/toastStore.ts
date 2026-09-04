import { create } from "zustand";

/**
 * Toast state lives apart from the components that render it.
 *
 * A module that exports both a component and a store opts out of React Fast
 * Refresh, so every edit to the toast card would full-reload the page.
 */

export type ToastTone = "info" | "success" | "warning" | "critical";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
  /** Optional deep link — clicking the toast takes you to the thing. */
  onClick?: () => void;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

/* Three at a time. Beyond that they stop being glanceable and start being a
   wall the user has to wait out. */
const MAX_VISIBLE = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience so callers don't reach into the store shape. */
export const toast = {
  info: (title: string, body?: string, onClick?: () => void) =>
    useToastStore.getState().push({ title, body, tone: "info", onClick }),
  success: (title: string, body?: string, onClick?: () => void) =>
    useToastStore.getState().push({ title, body, tone: "success", onClick }),
  warning: (title: string, body?: string, onClick?: () => void) =>
    useToastStore.getState().push({ title, body, tone: "warning", onClick }),
  critical: (title: string, body?: string, onClick?: () => void) =>
    useToastStore.getState().push({ title, body, tone: "critical", onClick }),
};
