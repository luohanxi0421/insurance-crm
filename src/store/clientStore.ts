import { create } from 'zustand';
import { Client } from '../types';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  loading: false,
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
  updateClient: (id, updates) =>
    set((state) => ({ clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
  removeClient: (id) =>
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));