// GET /api/dashboard — Combined management KPIs
// PRD W5: "Dashboard displays IT health, project timelines, and operational metrics"

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listClients } from "@/lib/db/queries/clients";
import { getTicketStats } from "@/lib/db/queries/tickets";
import { getProjectStats } from "@/lib/db/queries/projects";
import { listTeamMembers } from "@/lib/db/queries/team";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const [clients, tickets, projects, team] = await Promise.all([
        listClients({ limit: 100 }),
        getTicketStats({ range: "30d" }),
        getProjectStats(),
        listTeamMembers(),
      ]);

      return successResponse({
        clients: {
          total: clients.total,
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
        team: {
          totalMembers: team.length,
        },
      });
    } catch (err) {
      console.error("[dashboard] failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
