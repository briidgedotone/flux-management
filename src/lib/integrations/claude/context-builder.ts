// Cross-org AI context builder — queries all active orgs for management AI assistant
// R11: All aggregations filter is_active=true
// R36: Context must NOT contain API keys, secrets, or test org data
// Security: excludes emails and phone numbers from context

import { query } from "@/lib/db/client";

/** Build structured context string from all active org data for Claude. [R11, R36] */
export async function buildManagementContext(): Promise<string> {
  const [clients, ticketStats, projects, team, techStack] = await Promise.all([
    getClientSummary(),
    getCrossOrgTicketStats(),
    getActiveProjects(),
    getTeamSummary(),
    getTechStackSummary(),
  ]);

  return formatContext({ clients, ticketStats, projects, team, techStack });
}

async function getClientSummary() {
  const { rows } = await query(
    `SELECT o.name, o.slug,
       cp.industry, cp.primary_contact_name,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.status != 'Closed') AS open_tickets,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id) AS total_tickets,
       (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id AND p.status != 'Completed') AS active_projects,
       (SELECT COUNT(*) FROM infrastructure_items i WHERE i.organization_id = o.id) AS total_devices
     FROM organizations o
     LEFT JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE o.is_active = true AND o.slug != 'flux'
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
       COUNT(*) FILTER (WHERE t.priority = 'High') AS high,
       COALESCE(AVG(t.resolution_time_hours) FILTER (WHERE t.resolution_time_hours IS NOT NULL), 0) AS avg_resolution,
       COUNT(*) FILTER (WHERE t.created_at >= now() - interval '7 days') AS created_7d,
       COUNT(*) FILTER (WHERE t.created_at >= now() - interval '30 days') AS created_30d,
       COUNT(*) FILTER (WHERE t.status = 'Closed' AND t.updated_at >= now() - interval '7 days') AS resolved_7d
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
       (SELECT COUNT(*) FROM tickets t
        WHERE (t.assigned_to_email = u.email OR t.assigned_to_name = u.name)
        AND t.status = 'Closed') AS resolved,
       (SELECT COUNT(*) FROM project_tasks pt
        WHERE (pt.assigned_to_email = u.email OR pt.assigned_to_name = u.name)
        AND pt.status != 'Complete') AS active_tasks
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE u.is_active = true AND tm.status = 'active'
       AND u.email NOT LIKE '%@test.flux.internal'
     ORDER BY u.name`,
  );
  return rows;
}

async function getTechStackSummary() {
  const [totals, perClient] = await Promise.all([
    query(
      `SELECT
         (SELECT COUNT(*) FROM software_subscriptions s
          JOIN organizations o ON s.organization_id = o.id WHERE o.is_active = true) AS total_software,
         (SELECT COUNT(*) FROM infrastructure_items i
          JOIN organizations o ON i.organization_id = o.id WHERE o.is_active = true) AS total_devices,
         (SELECT COUNT(*) FROM infrastructure_items i
          JOIN organizations o ON i.organization_id = o.id WHERE o.is_active = true AND i.status = 'Online') AS devices_online,
         (SELECT COUNT(*) FROM infrastructure_items i
          JOIN organizations o ON i.organization_id = o.id WHERE o.is_active = true AND i.status = 'Offline') AS devices_offline,
         (SELECT COUNT(*) FROM cloud_services c
          JOIN organizations o ON c.organization_id = o.id WHERE o.is_active = true) AS total_cloud`,
    ),
    query(
      `SELECT o.name AS client_name,
         COALESCE(json_agg(DISTINCT jsonb_build_object('name', s.name, 'licenses', s.license_count))
           FILTER (WHERE s.id IS NOT NULL), '[]') AS software,
         COALESCE(json_agg(DISTINCT jsonb_build_object('name', c.name, 'provider', c.provider))
           FILTER (WHERE c.id IS NOT NULL), '[]') AS cloud
       FROM organizations o
       LEFT JOIN software_subscriptions s ON s.organization_id = o.id
       LEFT JOIN cloud_services c ON c.organization_id = o.id
       WHERE o.is_active = true AND o.slug != 'flux'
       GROUP BY o.name ORDER BY o.name`,
    ),
  ]);
  return { ...totals.rows[0], perClient: perClient.rows };
}

interface ContextData {
  clients: Record<string, unknown>[];
  ticketStats: Record<string, unknown>;
  projects: Record<string, unknown>[];
  team: Record<string, unknown>[];
  techStack: Record<string, unknown>;
}

function formatContext(data: ContextData): string {
  const sections: string[] = [];

  // Client summary
  if (data.clients.length > 0) {
    const lines = [`CLIENT SUMMARY: ${data.clients.length} active clients`];
    for (const c of data.clients) {
      lines.push(`- ${c.name}: ${c.industry || "N/A"}, ${c.open_tickets} open tickets, ${c.active_projects} active projects, ${c.total_devices} devices`);
    }
    sections.push(lines.join("\n"));
  }

  // Ticket stats
  const t = data.ticketStats;
  sections.push([
    `TICKET STATS (all clients combined):`,
    `  Total: ${t.total} | Open: ${t.open} | Pending: ${t.pending} | Closed: ${t.closed}`,
    `  Critical: ${t.critical} | High: ${t.high}`,
    `  Created last 7 days: ${t.created_7d} | Created last 30 days: ${t.created_30d}`,
    `  Resolved last 7 days: ${t.resolved_7d}`,
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

  // Tech stack
  const ts = data.techStack;
  const tsLines = [
    `TECH STACK OVERVIEW:`,
    `  Software subscriptions: ${ts.total_software}`,
    `  Infrastructure devices: ${ts.total_devices} (${ts.devices_online} online, ${ts.devices_offline} offline)`,
    `  Cloud services: ${ts.total_cloud}`,
  ];
  // Per-client breakdown
  if (ts.perClient) {
    for (const client of ts.perClient as Array<{ client_name: string; software: Array<{ name: string; licenses: number }>; cloud: Array<{ name: string; provider: string }> }>) {
      const sw = client.software.map((s) => `${s.name} (${s.licenses})`).join(", ");
      const cl = client.cloud.map((c) => c.name).join(", ");
      tsLines.push(`  ${client.client_name}:`);
      if (sw) tsLines.push(`    Software: ${sw}`);
      if (cl) tsLines.push(`    Cloud: ${cl}`);
    }
  }
  sections.push(tsLines.join("\n"));

  // Team
  if (data.team.length > 0) {
    const lines = [`TEAM: ${data.team.length} members`];
    for (const m of data.team) {
      lines.push(`- ${m.name} (${m.role}${m.department ? `, ${m.department}` : ""}): ${m.resolved} tickets resolved, ${m.active_tasks} active tasks`);
    }
    sections.push(lines.join("\n"));
  }

  return sections.join("\n\n");
}
