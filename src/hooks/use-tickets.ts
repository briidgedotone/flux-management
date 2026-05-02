"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useTickets(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: () => api.get("/api/tickets", filters),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => api.get("/api/tickets/" + id),
    enabled: !!id,
  });
}

export function useTicketStats(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.tickets.stats(filters),
    queryFn: () => api.get("/api/tickets/stats", filters),
  });
}

export function useTicketChartData(range = "7d") {
  return useQuery({
    queryKey: ["tickets", "chart-data", range],
    queryFn: () => api.get<{ date: string; created: number; resolved: number }[]>("/api/tickets/chart-data", { range }),
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      api.post("/api/tickets/" + ticketId + "/notes", { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.tickets.all }); },
  });
}
