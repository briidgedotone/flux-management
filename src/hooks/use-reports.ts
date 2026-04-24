"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useRevenueReport(range = "30d") {
  return useQuery({
    queryKey: queryKeys.reports.revenue(range),
    queryFn: () => api.get("/api/reports/revenue", { range }),
  });
}

export function useTeamPerformanceReport(range = "30d") {
  return useQuery({
    queryKey: queryKeys.reports.teamPerformance(range),
    queryFn: () => api.get("/api/reports/team-performance", { range }),
  });
}

export function useSlaReport(range = "30d") {
  return useQuery({
    queryKey: queryKeys.reports.sla(range),
    queryFn: () => api.get("/api/reports/sla-compliance", { range }),
  });
}

export function useTicketAnalyticsReport(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.reports.ticketAnalytics(filters),
    queryFn: () => api.get("/api/reports/ticket-analytics", filters),
  });
}
