"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

interface DashboardData {
  clients: { total: number };
  tickets: { total: number; open: number; pending: number; closed: number; critical: number; avgResolutionHours: number; createdLast30d: number; resolvedLast30d: number };
  projects: { total: number; onTrack: number; atRisk: number; delayed: number; avgProgress: number };
  team: { totalMembers: number };
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}
