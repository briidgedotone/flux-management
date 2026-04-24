// GET /api/dashboard — Combined management KPIs
// Security: withManagementAuth [R23]
// All aggregations filter is_active=true via query modules [R11]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listClients } from "@/lib/db/queries/clients";
import { getTicketStats } from "@/lib/db/queries/tickets";
import { getProjectStats } from "@/lib/db/queries/projects";
import { getRevenueReport } from "@/lib/db/queries/reports";
import { listTeamMembers } from "@/lib/db/queries/team";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      // Run all queries in parallel for performance
      const [clients, tickets, projects, revenue, team] = await Promise.all([
        listClients({ limit: 100 }),
        getTicketStats({ range: "30d" }),
        getProjectStats(),
        getRevenueReport(),
        listTeamMembers(),
      ]);

      // Client health summary
      const healthSummary = {
        healthy: clients.data.filter((c) => c.healthScore === "healthy").length,
        atRisk: clients.data.filter((c) => c.healthScore === "at-risk").length,
        critical: clients.data.filter((c) => c.healthScore === "critical").length,
      };

      // Team utilization snapshot
      const avgUtilization = team.length > 0
        ? Math.round(team.reduce((sum, m) => sum + m.utilizationTarget, 0) / team.length)
        : 0;

      return successResponse({
        revenue: {
          totalMonthly: revenue.totalRevenue,
          clientCount: revenue.clientCount,
        },
        tickets: {
          total: tickets.total,
          open: tickets.open,
          pending: tickets.pending,
          closed: tickets.closed,
          critical: tickets.critical,
          avgResolutionHours: tickets.avgResolutionHours,
          createdLast30d: tickets.createdInRange,
          resolvedLast30d: tickets.resolvedInRange,
        },
        projects: {
          total: projects.total,
          onTrack: projects.onTrack,
          atRisk: projects.atRisk,
          delayed: projects.delayed,
          avgProgress: projects.avgProgress,
        },
        clientHealth: healthSummary,
        team: {
          totalMembers: team.length,
          avgUtilization,
        },
      });
    } catch (err) {
      console.error("[dashboard] failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
