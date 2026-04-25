// Report query module — revenue, team performance, SLA, ticket analytics
// R11: ALL report queries MUST include WHERE o.is_active = true
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

/** Revenue breakdown by client. [R11: is_active=true] */
export async function getRevenueReport(range: "7d" | "30d" | "90d" = "30d") {
  const result = await query(
    `SELECT
       o.id AS client_id,
       o.name AS client_name,
       cp.monthly_revenue,
       cp.contract_status,
       cp.health_score
     FROM organizations o
     JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE o.is_active = true
     ORDER BY cp.monthly_revenue DESC NULLS LAST`,
  );

  const clients = result.rows.map((r) => ({
    clientId: r.client_id,
    clientName: r.client_name,
    monthlyRevenue: parseFloat(r.monthly_revenue) || 0,
    contractStatus: r.contract_status,
    healthScore: r.health_score,
  }));

  const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyRevenue, 0);

  return {
    clients,
    totalRevenue,
    clientCount: clients.length,
    range,
  };
}

/** Team performance metrics. */
export async function getTeamPerformanceReport(range: "7d" | "30d" | "90d" = "30d") {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const result = await query(
    `SELECT
       u.id, u.name, u.email, u.role,
       tm.capacity_hours_week, tm.utilization_target, tm.department,
       (SELECT COUNT(*) FROM tickets t
        WHERE t.assigned_to_email = u.email
        AND t.status = 'Closed'
        AND t.updated_at >= now() - interval '1 day' * $1) AS tickets_resolved,
       (SELECT COUNT(*) FROM project_tasks pt
        WHERE pt.assigned_to_email = u.email
        AND pt.status != 'Complete') AS active_tasks,
       (SELECT COALESCE(AVG(t2.resolution_time_hours), 0) FROM tickets t2
        WHERE t2.assigned_to_email = u.email
        AND t2.resolution_time_hours IS NOT NULL
        AND t2.updated_at >= now() - interval '1 day' * $1) AS avg_resolution_hours
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE u.is_active = true AND tm.status = 'active'
       AND u.email NOT LIKE '%@test.flux.internal'
     ORDER BY tickets_resolved DESC`,
    [days],
  );

  return {
    members: result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      department: r.department,
      capacityHoursWeek: r.capacity_hours_week,
      utilizationTarget: r.utilization_target,
      ticketsResolved: parseInt(r.tickets_resolved, 10),
      activeTasks: parseInt(r.active_tasks, 10),
      avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
    })),
    range,
  };
}

/** SLA compliance by client. [R11: is_active=true] */
export async function getSlaComplianceReport(range: "7d" | "30d" | "90d" = "30d") {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const result = await query(
    `SELECT
       o.id AS client_id,
       o.name AS client_name,
       cp.sla_target,
       COUNT(t.id) AS total_tickets,
       COUNT(t.id) FILTER (WHERE t.resolution_time_hours IS NOT NULL AND t.resolution_time_hours <= cp.sla_target) AS within_sla,
       COALESCE(AVG(t.resolution_time_hours) FILTER (WHERE t.resolution_time_hours IS NOT NULL), 0) AS avg_resolution_hours
     FROM organizations o
     JOIN client_profiles cp ON o.id = cp.organization_id
     LEFT JOIN tickets t ON t.organization_id = o.id
       AND t.created_at >= now() - interval '1 day' * $1
     WHERE o.is_active = true
     GROUP BY o.id, o.name, cp.sla_target
     ORDER BY o.name ASC`,
    [days],
  );

  return {
    clients: result.rows.map((r) => {
      const total = parseInt(r.total_tickets, 10);
      const withinSla = parseInt(r.within_sla, 10);
      return {
        clientId: r.client_id,
        clientName: r.client_name,
        slaTarget: r.sla_target,
        totalTickets: total,
        withinSla,
        slaPercent: total > 0 ? Math.round((withinSla / total) * 100) : 100,
        avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
      };
    }),
    range,
  };
}

/** Ticket analytics — volume, resolution, priority breakdown. [R11: is_active=true when no clientId] */
export async function getTicketAnalyticsReport(
  filters: { clientId?: string; range?: "7d" | "30d" | "90d" } = {},
) {
  const { clientId, range = "30d" } = filters;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const conditions: string[] = ["o.is_active = true"]; // R11
  const params: unknown[] = [days];
  let idx = 2;

  if (clientId) {
    conditions.push(`t.organization_id = $${idx++}`);
    params.push(clientId);
  }

  const whereClause = conditions.join(" AND ");

  const result = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE t.created_at >= now() - interval '1 day' * $1) AS created_in_range,
       COUNT(*) FILTER (WHERE t.status = 'Closed' AND t.updated_at >= now() - interval '1 day' * $1) AS resolved_in_range,
       COUNT(*) FILTER (WHERE t.priority = 'Critical') AS critical,
       COUNT(*) FILTER (WHERE t.priority = 'High') AS high,
       COUNT(*) FILTER (WHERE t.priority = 'Medium') AS medium,
       COUNT(*) FILTER (WHERE t.priority = 'Low') AS low,
       COALESCE(AVG(t.resolution_time_hours) FILTER (WHERE t.resolution_time_hours IS NOT NULL AND t.updated_at >= now() - interval '1 day' * $1), 0) AS avg_resolution_hours
     FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE ${whereClause}`,
    params,
  );

  const r = result.rows[0];
  return {
    total: parseInt(r.total, 10),
    createdInRange: parseInt(r.created_in_range, 10),
    resolvedInRange: parseInt(r.resolved_in_range, 10),
    priorityBreakdown: {
      critical: parseInt(r.critical, 10),
      high: parseInt(r.high, 10),
      medium: parseInt(r.medium, 10),
      low: parseInt(r.low, 10),
    },
    avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
    range,
  };
}
