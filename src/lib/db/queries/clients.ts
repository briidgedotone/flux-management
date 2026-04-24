// Client query module — cross-org list, detail, update, stats
// R11: Every cross-org aggregation MUST include WHERE o.is_active = true
// R13: Single-resource lookups by ID do NOT need is_active filter
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

interface ClientListFilters {
  industry?: string;
  healthScore?: string;
  contractStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

const SORT_COLS: Record<string, string> = {
  companyName: "o.name",
  monthlyRevenue: "cp.monthly_revenue",
  healthScore: "cp.health_score",
  contractStatus: "cp.contract_status",
  openTickets: "open_tickets",
  slaCompliance: "sla_compliance",
};

/** List all active clients with profile, ticket/project counts, and SLA. [R11: is_active=true] */
export async function listClients(filters: ClientListFilters = {}) {
  const {
    industry,
    healthScore,
    contractStatus,
    search,
    page = 1,
    limit = 50,
    sort = "companyName",
    order = "asc",
  } = filters;

  const conditions: string[] = ["o.is_active = true"]; // R11
  const params: unknown[] = [];
  let idx = 1;

  if (industry) {
    conditions.push(`cp.industry = $${idx++}`);
    params.push(industry);
  }
  if (healthScore) {
    conditions.push(`cp.health_score = $${idx++}`);
    params.push(healthScore);
  }
  if (contractStatus) {
    conditions.push(`cp.contract_status = $${idx++}`);
    params.push(contractStatus);
  }
  if (search) {
    conditions.push(`o.name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.join(" AND ");
  const sortCol = SORT_COLS[sort] ?? "o.name";
  const sortOrder = order === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * limit;

  // Count query
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM organizations o
     LEFT JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query with ticket/project counts and SLA
  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       o.id,
       o.name AS company_name,
       cp.industry,
       cp.monthly_revenue,
       cp.contract_status,
       cp.contract_start_date,
       cp.health_score,
       cp.sla_target,
       cp.primary_contact_name,
       cp.primary_contact_email,
       cp.primary_contact_phone,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.status != 'Closed') AS open_tickets,
       (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id AND p.status != 'Completed') AS active_projects,
       (SELECT COALESCE(
         ROUND(
           COUNT(*) FILTER (WHERE t2.resolution_time_hours IS NOT NULL AND t2.resolution_time_hours <= cp.sla_target) * 100.0
           / NULLIF(COUNT(*) FILTER (WHERE t2.resolution_time_hours IS NOT NULL), 0)
         , 0)
       , 0) FROM tickets t2 WHERE t2.organization_id = o.id) AS sla_compliance,
       (SELECT MAX(t3.updated_at) FROM tickets t3 WHERE t3.organization_id = o.id) AS last_activity
     FROM organizations o
     LEFT JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE ${whereClause}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    companyName: r.company_name,
    primaryContact: {
      name: r.primary_contact_name ?? "",
      email: r.primary_contact_email ?? "",
      phone: r.primary_contact_phone ?? undefined,
    },
    industry: r.industry ?? "",
    contractStatus: r.contract_status ?? "active",
    contractStartDate: r.contract_start_date?.toISOString?.() ?? "",
    healthScore: r.health_score ?? "healthy",
    monthlyRevenue: parseFloat(r.monthly_revenue) || 0,
    lastActivity: r.last_activity?.toISOString?.() ?? "",
    openTickets: parseInt(r.open_tickets, 10),
    activeProjects: parseInt(r.active_projects, 10),
    slaCompliance: parseInt(r.sla_compliance, 10),
  }));

  return { data, total, page, limit };
}

/** Get single client detail — by org ID. [R13: no is_active filter on single lookup] */
export async function getClient(clientId: string) {
  const result = await query(
    `SELECT
       o.id,
       o.name AS company_name,
       o.slug,
       cp.id AS profile_id,
       cp.industry,
       cp.monthly_revenue,
       cp.contract_status,
       cp.contract_start_date,
       cp.contract_end_date,
       cp.health_score,
       cp.sla_target,
       cp.primary_contact_name,
       cp.primary_contact_email,
       cp.primary_contact_phone,
       cp.notes,
       cp.created_at,
       cp.updated_at,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.status != 'Closed') AS open_tickets,
       (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id AND p.status != 'Completed') AS active_projects
     FROM organizations o
     LEFT JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE o.id = $1`,
    [clientId],
  );

  if (!result.rows[0]) return null;

  const r = result.rows[0];
  return {
    id: r.id,
    companyName: r.company_name,
    slug: r.slug,
    profileId: r.profile_id,
    industry: r.industry,
    monthlyRevenue: parseFloat(r.monthly_revenue) || 0,
    contractStatus: r.contract_status,
    contractStartDate: r.contract_start_date?.toISOString?.() ?? null,
    contractEndDate: r.contract_end_date?.toISOString?.() ?? null,
    healthScore: r.health_score,
    slaTarget: r.sla_target,
    primaryContact: {
      name: r.primary_contact_name ?? "",
      email: r.primary_contact_email ?? "",
      phone: r.primary_contact_phone ?? undefined,
    },
    notes: r.notes,
    openTickets: parseInt(r.open_tickets, 10),
    activeProjects: parseInt(r.active_projects, 10),
    createdAt: r.created_at?.toISOString?.() ?? null,
    updatedAt: r.updated_at?.toISOString?.() ?? null,
  };
}

/** Update client profile fields. [R15: parameterized, R17: no SELECT *] */
export async function updateClientProfile(
  clientId: string,
  data: {
    monthlyRevenue?: number;
    contractStatus?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    healthScore?: string;
    slaTarget?: number;
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    industry?: string;
    notes?: string;
  },
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    monthlyRevenue: "monthly_revenue",
    contractStatus: "contract_status",
    contractStartDate: "contract_start_date",
    contractEndDate: "contract_end_date",
    healthScore: "health_score",
    slaTarget: "sla_target",
    primaryContactName: "primary_contact_name",
    primaryContactEmail: "primary_contact_email",
    primaryContactPhone: "primary_contact_phone",
    industry: "industry",
    notes: "notes",
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    const value = data[key as keyof typeof data];
    if (value !== undefined) {
      fields.push(`${col} = $${idx++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = now()");
  params.push(clientId);

  const result = await query(
    `UPDATE client_profiles SET ${fields.join(", ")}
     WHERE organization_id = $${idx}
     RETURNING id, organization_id, industry, monthly_revenue, contract_status,
       health_score, sla_target, primary_contact_name, primary_contact_email,
       primary_contact_phone, notes, updated_at`,
    params,
  );

  return result.rows[0] ?? null;
}

/** Get client-specific stats over a time range. [R13: single client, no is_active filter] */
export async function getClientStats(clientId: string, range: "7d" | "30d" | "90d" = "30d") {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND created_at >= now() - interval '1 day' * $2) AS tickets_created,
       (SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND status = 'Closed' AND updated_at >= now() - interval '1 day' * $2) AS tickets_resolved,
       (SELECT COALESCE(AVG(resolution_time_hours), 0) FROM tickets WHERE organization_id = $1 AND resolution_time_hours IS NOT NULL AND updated_at >= now() - interval '1 day' * $2) AS avg_resolution_time_hours,
       (SELECT COUNT(*) FROM tickets WHERE organization_id = $1 AND status != 'Closed') AS open_tickets,
       (SELECT COUNT(*) FROM projects WHERE organization_id = $1 AND status != 'Completed') AS active_projects,
       (SELECT COALESCE(AVG(progress), 0) FROM projects WHERE organization_id = $1) AS avg_project_progress`,
    [clientId, days],
  );

  const r = result.rows[0];
  return {
    ticketsCreated: parseInt(r.tickets_created, 10),
    ticketsResolved: parseInt(r.tickets_resolved, 10),
    avgResolutionHours: parseFloat(r.avg_resolution_time_hours) || 0,
    openTickets: parseInt(r.open_tickets, 10),
    activeProjects: parseInt(r.active_projects, 10),
    avgProjectProgress: parseFloat(r.avg_project_progress) || 0,
    range,
  };
}
