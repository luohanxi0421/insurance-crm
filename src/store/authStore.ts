import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { getCurrentUser } from '../lib/api';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  initialize: async () => {
    set({ loading: true });
    try {
      const user = await getCurrentUser();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));