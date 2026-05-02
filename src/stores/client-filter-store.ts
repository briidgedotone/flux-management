import { create } from "zustand";

interface ClientFilterState {
  selectedClientId: string | null; // null = "All Clients"
  selectedClientName: string | null;
  setClient: (id: string | null, name: string | null) => void;
  clearClient: () => void;
}

export const useClientFilterStore = create<ClientFilterState>((set) => ({
  selectedClientId: null,
  selectedClientName: null,
  setClient: (id, name) => set({ selectedClientId: id, selectedClientName: name }),
  clearClient: () => set({ selectedClientId: null, selectedClientName: null }),
}));
