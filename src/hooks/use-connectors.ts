"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useConnectors() {
  return useQuery({
    queryKey: queryKeys.connectors,
    queryFn: () => api.get("/api/connectors"),
  });
}
