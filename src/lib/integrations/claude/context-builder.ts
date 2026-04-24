// Cross-org AI context builder — queries all active orgs for management AI assistant
// R11: All aggregations filter is_active=true
// R36: Context must NOT contain API keys, secrets, or test org data
// Security: excludes emails and phone numbers from context

import { query } from "@/lib/db/client";

/** Build structured context string from all active org data for Claude. [R11, R36] */
export async function buildManagementContext(): Promise<string> {
  const [clients, ticketStats, projects, team, revenue] = await Promise.all([
    getClientSummary(),
    getCrossOrgTicketStats(),
    getActiveProjects(),
    getTeamSummary(),
    getRevenueSummary(),
  ]);

  return formatContext({ clients, ticketStats, projects, team, revenue });
}

async function getClientSummary() {
  const { rows } = await query(
    `SELECT o.name, cp.industry, cp.monthly_revenue, cp.health_score,
       cp.contract_status, cp.sla_target,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.status != 'Closed') AS open_tickets
     FROM organizations o
     JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE o.is_active = true
     ORDER BY o.name`,
  );
  return rows;
}

async function getCrossOrgTicketStats() {
  const { rows } = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE t.status = 'Open') AS open,
       COUNT(*) FILTER (WHERE t.status = 'Pending') AS pending,
       COUNT(*) FILTER (WHERE t.status = 'Closed') AS closed,
       COUNT(*) FILTER (WHERE t.priority = 'Critical') AS critical,
       COALESCE(AVG(t.resolution_time_hours) FILTER (WHERE t.resolution_time_hours IS NOT NULL), 0) AS avg_resolution,
       COUNT(*) FILTER (WHERE t.created_at >= now() - interval '30 days') AS created_30d
     FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE o.is_active = true`,
  );
  return rows[0];
}

async function getActiveProjects() {
  const { rows } = await query(
    `SELECT p.name, p.status, p.progress, p.tasks_completed, p.total_tasks,
       p.due_date, o.name AS client_name
     FROM projects p
     JOIN organizations o ON p.organization_id = o.id
     WHERE o.is_active = true AND p.status != 'Completed'
     ORDER BY p.updated_at DESC LIMIT 20`,
  );
  return rows;
}

async function getTeamSummary() {
  const { rows } = await query(
    `SELECT u.name, u.role, tm.department,
       (SELECT COUNT(*) FROM tickets t WHERE t.assigned_to_email = u.email AND t.status = 'Closed') AS resolved,
       (SELECT COUNT(*) FROM project_tasks pt WHERE pt.assigned_to_email = u.email AND pt.status != 'Complete') AS active_tasks
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE u.is_active = true AND tm.status = 'active'
     ORDER BY u.name`,
  );
  return rows;
}

async function getRevenueSummary() {
  const { rows } = await query(
    `SELECT
       SUM(cp.monthly_revenue) AS total_revenue,
       COUNT(*) AS client_count,
       COUNT(*) FILTER (WHERE cp.health_score = 'healthy') AS healthy,
       COUNT(*) FILTER (WHERE cp.health_score = 'at-risk') AS at_risk,
       COUNT(*) FILTER (WHERE cp.health_score = 'critical') AS critical_health
     FROM organizations o
     JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE o.is_active = true`,
  );
  return rows[0];
}

interface ContextData {
  clients: Record<string, unknown>[];
  ticketStats: Record<string, unknown>;
  projects: Record<string, unknown>[];
  team: Record<string, unknown>[];
  revenue: Record<string, unknown>;
}

function formatContext(data: ContextData): string {
  const sections: string[] = [];

  // Revenue overview
  const rev = data.revenue;
  sections.push([
    `REVENUE OVERVIEW:`,
    `  Total monthly: $${parseFloat(String(rev.total_revenue || 0)).toLocaleString()}`,
    `  Clients: ${rev.client_count} (${rev.healthy} healthy, ${rev.at_risk} at-risk, ${rev.critical_health} critical)`,
  ].join("\n"));

  // Client summary
  if (data.clients.length > 0) {
    const lines = [`CLIENT SUMMARY: ${data.clients.length} active clients`];
    for (const c of data.clients) {
      const rev = parseFloat(String(c.monthly_revenue || 0));
      lines.push(`- ${c.name}: ${c.industry}, $${rev.toLocaleString()}/mo, ${c.health_score}, ${c.open_tickets} open tickets, SLA target ${c.sla_target}%`);
    }
    sections.push(lines.join("\n"));
  }

  // Ticket stats
  const t = data.ticketStats;
  sections.push([
    `TICKET STATS (all clients combined):`,
    `  Total: ${t.total} | Open: ${t.open} | Pending: ${t.pending} | Closed: ${t.closed}`,
    `  Critical: ${t.critical} | Created last 30d: ${t.created_30d}`,
    `  Avg resolution: ${parseFloat(String(t.avg_resolution || 0)).toFixed(1)} hours`,
  ].join("\n"));

  // Active projects
  if (data.projects.length > 0) {
    const lines = [`ACTIVE PROJECTS: ${data.projects.length}`];
    for (const p of data.projects) {
      const due = p.due_date ? ` due ${String(p.due_date).split("T")[0]}` : "";
      lines.push(`- ${p.name} (${p.client_name}): ${p.status}, ${p.progress}% (${p.tasks_completed}/${p.total_tasks} tasks)${due}`);
    }
    sections.push(lines.join("\n"));
  }

  // Team
  if (data.team.length > 0) {
    const lines = [`TEAM: ${data.team.length} members`];
    for (const m of data.team) {
      lines.push(`- ${m.name} (${m.role}, ${m.department}): ${m.resolved} tickets resolved, ${m.active_tasks} active tasks`);
    }
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}
