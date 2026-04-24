"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

interface DashboardData {
  revenue: { totalMonthly: number; clientCount: number };
  tickets: { total: number; open: number; pending: number; closed: number; critical: number; avgResolutionHours: number; createdLast30d: number; resolvedLast30d: number };
  projects: { total: number; onTrack: number; atRisk: number; delayed: number; avgProgress: number };
  clientHealth: { healthy: number; atRisk: number; critical: number };
  team: { totalMembers: number; avgUtilization: number };
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}
