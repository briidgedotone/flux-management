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

  // Exclude Flux Technologies (the MSP itself, not a client) and test org
  const conditions: string[] = ["o.is_active = true", "o.slug != 'flux'"]; // R11 + exclude self
  const params: unknown[] = [];
  let idx = 1;

  if (industry) {
    conditions.push(`cp.industry = $${idx++}`);
    params.push(industry);
  }
  if (search) {
    conditions.push(`o.name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.join(" AND ");
  const sortCol = SORT_COLS[sort] ?? "o.name";
  const sortOrder = order === "desc" ? "DESC" : "ASC";
  const offset = (page - 1) * limit;

  // Count — LEFT JOIN so new orgs without profiles still appear
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM organizations o
     LEFT JOIN client_profiles cp ON o.id = cp.organization_id
     WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query — LEFT JOIN, no scope creep fields (revenue, health, contract, SLA removed)
  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       o.id,
       o.name AS company_name,
       cp.industry,
       cp.primary_contact_name,
       cp.primary_contact_email,
       cp.primary_contact_phone,
       cp.notes,
       (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.status != 'Closed') AS open_tickets,
       (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id AND p.status != 'Completed') AS active_projects,
       (SELECT MAX(t3.updated_at) FROM tickets t3 WHERE t3.organization_id = o.id) AS last_activity,
       CASE WHEN cp.id IS NOT NULL THEN true ELSE false END AS has_profile
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
    notes: r.notes ?? "",
    lastActivity: r.last_activity?.toISOString?.() ?? "",
    openTickets: parseInt(r.open_tickets, 10),
    activeProjects: parseInt(r.active_projects, 10),
    hasProfile: r.has_profile,
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
    hasProfile: !!r.profile_id,
    industry: r.industry ?? "",
    primaryContact: {
      name: r.primary_contact_name ?? "",
      email: r.primary_contact_email ?? "",
      phone: r.primary_contact_phone ?? undefined,
    },
    notes: r.notes ?? "",
    openTickets: parseInt(r.open_tickets, 10),
    activeProjects: parseInt(r.active_projects, 10),
    createdAt: r.created_at?.toISOString?.() ?? null,
    updatedAt: r.updated_at?.toISOString?.() ?? null,
  };
}

/** Create a client profile for an org that doesn't have one yet. */
export async function createClientProfile(
  organizationId: string,
  data: {
    primaryContactName?: string;
    primaryContactEmail?: string;
    primaryContactPhone?: string;
    industry?: string;
    notes?: string;
  },
) {
  const result = await query(
    `INSERT INTO client_profiles (organization_id, primary_contact_name, primary_contact_email, primary_contact_phone, industry, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (organization_id) DO UPDATE SET
       primary_contact_name = COALESCE(EXCLUDED.primary_contact_name, client_profiles.primary_contact_name),
       primary_contact_email = COALESCE(EXCLUDED.primary_contact_email, client_profiles.primary_contact_email),
       primary_contact_phone = COALESCE(EXCLUDED.primary_contact_phone, client_profiles.primary_contact_phone),
       industry = COALESCE(EXCLUDED.industry, client_profiles.industry),
       notes = COALESCE(EXCLUDED.notes, client_profiles.notes),
       updated_at = now()
     RETURNING id, organization_id, industry, primary_contact_name, primary_contact_email,
       primary_contact_phone, notes, updated_at`,
    [organizationId, data.primaryContactName ?? null, data.primaryContactEmail ?? null,
     data.primaryContactPhone ?? null, data.industry ?? null, data.notes ?? null],
  );
  return result.rows[0] ?? null;
}

/** Update client profile fields. [R15: parameterized] */
export async function updateClientProfile(
  clientId: string,
  data: {
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
     RETURNING id, organization_id, industry, primary_contact_name, primary_contact_email,
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
