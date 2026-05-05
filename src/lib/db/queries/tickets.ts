// Ticket query module — cross-org list, detail with internal notes, stats
// R11: Cross-org aggregations MUST include WHERE o.is_active = true
// R13: Single-resource lookups by ID do NOT need is_active filter
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

interface TicketListFilters {
  status?: string;
  priority?: string;
  clientId?: string;
  assignee?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

const SORT_COLS: Record<string, string> = {
  created_at: "t.created_at",
  updated_at: "t.updated_at",
  priority: "t.priority",
  status: "t.status",
  subject: "t.subject",
};

/** List all tickets across active orgs with filters and pagination. [R11: is_active=true] */
export async function listTickets(filters: TicketListFilters = {}) {
  const {
    status,
    priority,
    clientId,
    assignee,
    search,
    page = 1,
    limit = 25,
    sort = "created_at",
    order = "desc",
  } = filters;

  const conditions: string[] = ["o.is_active = true"]; // R11
  const params: unknown[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`t.status = $${idx++}`);
    params.push(status);
  }
  if (priority) {
    conditions.push(`t.priority = $${idx++}`);
    params.push(priority);
  }
  if (clientId) {
    conditions.push(`t.organization_id = $${idx++}`);
    params.push(clientId);
  }
  if (assignee) {
    conditions.push(`t.assigned_to_name ILIKE $${idx++}`);
    params.push(`%${assignee}%`);
  }
  if (search) {
    conditions.push(`(t.subject ILIKE $${idx} OR t.ticket_number ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.join(" AND ");
  const sortCol = SORT_COLS[sort] ?? "t.created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * limit;

  // Count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data
  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       t.id, t.ticket_number, t.subject, t.description, t.status, t.priority,
       t.assigned_to_name, t.assigned_to_email,
       t.created_by_name, t.source, t.resolution_time_hours,
       t.created_at, t.updated_at, t.closed_at,
       o.id AS client_id, o.name AS client_name
     FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE ${whereClause}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    ticketNumber: r.ticket_number,
    subject: r.subject,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assignedToName: r.assigned_to_name,
    assignedToEmail: r.assigned_to_email,
    createdByName: r.created_by_name,
    source: r.source,
    resolutionTimeHours: r.resolution_time_hours ? parseFloat(r.resolution_time_hours) : null,
    createdAt: r.created_at?.toISOString?.() ?? "",
    updatedAt: r.updated_at?.toISOString?.() ?? "",
    closedAt: r.closed_at?.toISOString?.() ?? null,
    clientId: r.client_id,
    clientName: r.client_name,
  }));

  return { data, total, page, limit };
}

/** Get single ticket with activities, attachments, and internal notes. [R13: no is_active filter] */
export async function getTicket(ticketId: string) {
  // Main ticket
  const ticketResult = await query(
    `SELECT
       t.id, t.organization_id, t.ticket_number, t.subject, t.description,
       t.status, t.priority, t.assigned_to_name, t.assigned_to_email,
       t.created_by_name, t.created_by_email, t.source, t.resolution_time_hours,
       t.created_at, t.updated_at, t.closed_at,
       o.name AS client_name
     FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE t.id = $1`,
    [ticketId],
  );

  if (!ticketResult.rows[0]) return null;
  const t = ticketResult.rows[0];

  // Activities
  const activitiesResult = await query(
    `SELECT id, type, title, note, performed_by, created_at
     FROM ticket_activities WHERE ticket_id = $1
     ORDER BY created_at DESC`,
    [ticketId],
  );

  // Attachments
  const attachmentsResult = await query(
    `SELECT id, name, file_type, size, url, created_at
     FROM ticket_attachments WHERE ticket_id = $1
     ORDER BY created_at DESC`,
    [ticketId],
  );

  // Internal notes (management-only)
  const notesResult = await query(
    `SELECT n.id, n.content, n.created_at, n.updated_at, u.name AS author_name, u.email AS author_email
     FROM internal_notes n
     JOIN users u ON n.author_id = u.id
     WHERE n.ticket_id = $1
     ORDER BY n.created_at DESC`,
    [ticketId],
  );

  return {
    id: t.id,
    organizationId: t.organization_id,
    ticketNumber: t.ticket_number,
    subject: t.subject,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignedToName: t.assigned_to_name,
    assignedToEmail: t.assigned_to_email,
    createdByName: t.created_by_name,
    createdByEmail: t.created_by_email,
    source: t.source,
    resolutionTimeHours: t.resolution_time_hours ? parseFloat(t.resolution_time_hours) : null,
    createdAt: t.created_at?.toISOString?.() ?? "",
    updatedAt: t.updated_at?.toISOString?.() ?? "",
    closedAt: t.closed_at?.toISOString?.() ?? null,
    clientName: t.client_name,
    activities: activitiesResult.rows.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      note: a.note,
      performedBy: a.performed_by,
      createdAt: a.created_at?.toISOString?.() ?? "",
    })),
    attachments: attachmentsResult.rows.map((a) => ({
      id: a.id,
      name: a.name,
      fileType: a.file_type,
      size: a.size,
      url: a.url,
      createdAt: a.created_at?.toISOString?.() ?? "",
    })),
    internalNotes: notesResult.rows.map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.author_name,
      authorEmail: n.author_email,
      createdAt: n.created_at?.toISOString?.() ?? "",
      updatedAt: n.updated_at?.toISOString?.() ?? "",
    })),
  };
}

/** Cross-client ticket metrics. [R11: is_active=true] */
export async function getTicketStats(filters: { clientId?: string; range?: "7d" | "30d" | "90d" } = {}) {
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
       COUNT(*) FILTER (WHERE t.status = 'Open') AS open_count,
       COUNT(*) FILTER (WHERE t.status = 'Pending') AS pending_count,
       COUNT(*) FILTER (WHERE t.status = 'Closed') AS closed_count,
       COUNT(*) FILTER (WHERE t.priority = 'Critical') AS critical_count,
       COUNT(*) FILTER (WHERE t.priority = 'High') AS high_count,
       COUNT(*) FILTER (WHERE t.created_at >= now() - interval '1 day' * $1) AS created_in_range,
       COUNT(*) FILTER (WHERE t.status = 'Closed' AND t.updated_at >= now() - interval '1 day' * $1) AS resolved_in_range,
       COALESCE(AVG(t.resolution_time_hours) FILTER (WHERE t.resolution_time_hours IS NOT NULL), 0) AS avg_resolution_hours
     FROM tickets t
     JOIN organizations o ON t.organization_id = o.id
     WHERE ${whereClause}`,
    params,
  );

  const r = result.rows[0];
  return {
    total: parseInt(r.total, 10),
    open: parseInt(r.open_count, 10),
    pending: parseInt(r.pending_count, 10),
    closed: parseInt(r.closed_count, 10),
    critical: parseInt(r.critical_count, 10),
    high: parseInt(r.high_count, 10),
    createdInRange: parseInt(r.created_in_range, 10),
    resolvedInRange: parseInt(r.resolved_in_range, 10),
    avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
    range,
  };
}

/** Chart-ready ticket data grouped by day. */
export async function getTicketChartData(clientId: string | null, range: "7d" | "30d" | "90d" = "30d") {
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
       d.date,
       COUNT(t.id) FILTER (WHERE t.created_at::date = d.date) AS created,
       COUNT(t.id) FILTER (WHERE t.closed_at::date = d.date) AS resolved
     FROM generate_series(
       (now() - interval '1 day' * $1)::date,
       now()::date,
       '1 day'::interval
     ) AS d(date)
     LEFT JOIN tickets t ON (t.created_at::date = d.date OR t.closed_at::date = d.date)
     LEFT JOIN organizations o ON t.organization_id = o.id AND ${whereClause}
     GROUP BY d.date
     ORDER BY d.date ASC`,
    params,
  );

  return result.rows.map((r) => ({
    date: r.date?.toISOString?.()?.split("T")[0] ?? "",
    created: parseInt(r.created, 10),
    resolved: parseInt(r.resolved, 10),
  }));
}

/** Add an internal note to a ticket (management-only). [R15: parameterized] */
export async function addInternalNote(ticketId: string, authorId: string, content: string) {
  const result = await query(
    `INSERT INTO internal_notes (ticket_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, ticket_id, author_id, content, created_at`,
    [ticketId, authorId, content],
  );
  return result.rows[0] ?? null;
}
