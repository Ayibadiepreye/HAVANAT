import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  isMobileMenuOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleMobileMenu: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  activeModal: null,
  toasts: [],

  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  showToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set((s) => ({
      toasts: [...s.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
