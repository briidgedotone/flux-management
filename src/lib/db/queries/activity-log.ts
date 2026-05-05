// Activity log query module — audit trail for all management mutations
// R29: Every mutation MUST write to activity_log
// R30: Read-only operations do NOT log
// R31: Log entries must include user_id, action, entity_type, entity_id, organization_id, description
// R15: Parameterized SQL only

import { query } from "../client";

/** Write an audit entry. Called by every mutation endpoint. [R29] */
export async function logActivity(
  userId: string,
  action: "created" | "updated" | "deleted",
  entityType: string,
  entityId: string | null,
  organizationId: string | null,
  description: string,
  metadata?: Record<string, unknown>,
) {
  const result = await query(
    `INSERT INTO activity_log (user_id, action, entity_type, entity_id, organization_id, description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [userId, action, entityType, entityId, organizationId, description, metadata ? JSON.stringify(metadata) : null],
  );
  return result.rows[0] ?? null;
}

interface ActivityLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  organizationId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

/** List activity log entries with filters and pagination. */
export async function listActivityLog(filters: ActivityLogFilters = {}) {
  const { entityType, entityId, userId, organizationId, action, page = 1, limit = 25 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (entityType) {
    conditions.push(`al.entity_type = $${idx++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`al.entity_id = $${idx++}`);
    params.push(entityId);
  }
  if (userId) {
    conditions.push(`al.user_id = $${idx++}`);
    params.push(userId);
  }
  if (organizationId) {
    conditions.push(`al.organization_id = $${idx++}`);
    params.push(organizationId);
  }
  if (action) {
    conditions.push(`al.action = $${idx++}`);
    params.push(action);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM activity_log al ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id,
       al.organization_id, al.description, al.metadata, al.created_at,
       u.name AS user_name, u.email AS user_email
     FROM activity_log al
     JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    organizationId: r.organization_id,
    description: r.description,
    metadata: r.metadata,
    createdAt: r.created_at?.toISOString?.() ?? "",
  }));

  return { data, total, page, limit };
}
