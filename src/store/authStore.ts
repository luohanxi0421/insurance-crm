import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  loading: boolean;
  isPasswordResetMode: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPasswordResetMode: (value: boolean) => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  isPasswordResetMode: false,
  setPasswordResetMode: (value) => set({ isPasswordResetMode: value }),
  initialize: async () => {
    set({ loading: true });
    try {
      // If we're in password-reset mode (set by deep-link processing),
      // skip auth check — the recovery session is already handled by App.tsx.
      const currentState = useAuth.getState();
      if (currentState.isPasswordResetMode) {
        set({ loading: false });
        return;
      }

      // First try restoring session from local storage (fast, no network).
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        set({ user: null, loading: false });
        return;
      }

      // Session exists locally – validate it with the server.
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        // Session expired or invalid – clear local state.
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }

      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));