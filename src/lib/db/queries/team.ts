// Team query module — list with computed metrics, detail, update
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

/** List all team members with computed metrics. */
export async function listTeamMembers() {
  const result = await query(
    `SELECT
       u.id, u.email, u.name, u.initials, u.role, u.avatar_url,
       tm.id AS member_id, tm.department, tm.status,
       tm.capacity_hours_week, tm.utilization_target, tm.hire_date,
       (SELECT COUNT(*) FROM tickets t
        WHERE (t.assigned_to_email = u.email OR t.assigned_to_name = u.name) AND t.status = 'Closed') AS tickets_resolved,
       (SELECT COUNT(*) FROM project_tasks pt
        WHERE (pt.assigned_to_email = u.email OR pt.assigned_to_name = u.name) AND pt.status != 'Complete') AS active_tasks,
       (SELECT COALESCE(AVG(t2.resolution_time_hours), 0) FROM tickets t2
        WHERE (t2.assigned_to_email = u.email OR t2.assigned_to_name = u.name) AND t2.resolution_time_hours IS NOT NULL) AS avg_resolution_hours
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE u.is_active = true
       AND u.email NOT LIKE '%@test.flux.internal'
     ORDER BY u.name ASC`,
  );

  return result.rows.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    email: r.email,
    name: r.name,
    initials: r.initials,
    role: r.role,
    avatarUrl: r.avatar_url,
    department: r.department,
    status: r.status,
    capacityHoursWeek: r.capacity_hours_week,
    utilizationTarget: r.utilization_target,
    hireDate: r.hire_date?.toISOString?.()?.split("T")[0] ?? null,
    ticketsResolved: parseInt(r.tickets_resolved, 10),
    activeTasks: parseInt(r.active_tasks, 10),
    avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
  }));
}

/** Get single team member detail. */
export async function getTeamMember(userId: string) {
  const result = await query(
    `SELECT
       u.id, u.email, u.name, u.initials, u.role, u.avatar_url, u.phone, u.last_login,
       tm.id AS member_id, tm.department, tm.status,
       tm.capacity_hours_week, tm.utilization_target, tm.hire_date,
       tm.created_at, tm.updated_at,
       (SELECT COUNT(*) FROM tickets t
        WHERE (t.assigned_to_email = u.email OR t.assigned_to_name = u.name) AND t.status = 'Closed') AS tickets_resolved,
       (SELECT COUNT(*) FROM project_tasks pt
        WHERE (pt.assigned_to_email = u.email OR pt.assigned_to_name = u.name) AND pt.status != 'Complete') AS active_tasks,
       (SELECT COALESCE(AVG(t2.resolution_time_hours), 0) FROM tickets t2
        WHERE (t2.assigned_to_email = u.email OR t2.assigned_to_name = u.name) AND t2.resolution_time_hours IS NOT NULL) AS avg_resolution_hours
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE u.id = $1`,
    [userId],
  );

  if (!result.rows[0]) return null;
  const r = result.rows[0];

  return {
    id: r.id,
    memberId: r.member_id,
    email: r.email,
    name: r.name,
    initials: r.initials,
    role: r.role,
    avatarUrl: r.avatar_url,
    phone: r.phone,
    lastLogin: r.last_login?.toISOString?.() ?? null,
    department: r.department,
    status: r.status,
    capacityHoursWeek: r.capacity_hours_week,
    utilizationTarget: r.utilization_target,
    hireDate: r.hire_date?.toISOString?.()?.split("T")[0] ?? null,
    ticketsResolved: parseInt(r.tickets_resolved, 10),
    activeTasks: parseInt(r.active_tasks, 10),
    avgResolutionHours: parseFloat(r.avg_resolution_hours) || 0,
    createdAt: r.created_at?.toISOString?.() ?? null,
    updatedAt: r.updated_at?.toISOString?.() ?? null,
  };
}

/** Update team member profile. [R15: parameterized] */
export async function updateTeamMember(
  userId: string,
  data: {
    capacityHoursWeek?: number;
    utilizationTarget?: number;
    department?: string;
    status?: string;
    hireDate?: string;
  },
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    capacityHoursWeek: "capacity_hours_week",
    utilizationTarget: "utilization_target",
    department: "department",
    status: "status",
    hireDate: "hire_date",
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
  params.push(userId);

  const result = await query(
    `UPDATE team_members SET ${fields.join(", ")}
     WHERE user_id = $${idx}
     RETURNING id, user_id, department, status, capacity_hours_week,
       utilization_target, hire_date, updated_at`,
    params,
  );

  return result.rows[0] ?? null;
}
