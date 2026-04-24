"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";
import type { Client } from "@/types";

interface ClientListResponse { data: Client[]; total: number; page: number; limit: number; totalPages: number }

export function useClients(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => api.get<ClientListResponse>("/api/clients", filters).then(r => r as unknown as ClientListResponse),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => api.get("/api/clients/" + id),
    enabled: !!id,
  });
}

export function useClientStats(id: string, range = "30d") {
  return useQuery({
    queryKey: queryKeys.clients.stats(id, range),
    queryFn: () => api.get("/api/clients/" + id + "/stats", { range }),
    enabled: !!id,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put("/api/clients/" + id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.clients.all }); },
  });
}
