"use client";

import { useClientFilterStore } from "@/stores/client-filter-store";

/** Returns the selected client filter. Use in pages to scope data to a client. */
export function useClientFilter() {
  const { selectedClientId, selectedClientName } = useClientFilterStore();
  return {
    clientId: selectedClientId,
    clientName: selectedClientName,
    isFiltered: selectedClientId !== null,
  };
}
