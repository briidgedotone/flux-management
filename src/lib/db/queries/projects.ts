// Project query module — cross-org list, detail, stats, task CRUD
// R11: Cross-org aggregations MUST include WHERE o.is_active = true
// R13: Single-resource lookups by ID do NOT need is_active filter
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

interface ProjectListFilters {
  status?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

const SORT_COLS: Record<string, string> = {
  name: "p.name",
  status: "p.status",
  progress: "p.progress",
  due_date: "p.due_date",
  created_at: "p.created_at",
};

/** List all projects across active orgs. [R11: is_active=true] */
export async function listProjects(filters: ProjectListFilters = {}) {
  const {
    status,
    clientId,
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
    conditions.push(`p.status = $${idx++}`);
    params.push(status);
  }
  if (clientId) {
    conditions.push(`p.organization_id = $${idx++}`);
    params.push(clientId);
  }
  if (search) {
    conditions.push(`p.name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.join(" AND ");
  const sortCol = SORT_COLS[sort] ?? "p.created_at";
  const sortOrder = order === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM projects p
     JOIN organizations o ON p.organization_id = o.id
     WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       p.id, p.project_number, p.name, p.description, p.category,
       p.status, p.progress, p.tasks_completed, p.total_tasks,
       p.start_date, p.due_date, p.created_at, p.updated_at,
       o.id AS client_id, o.name AS client_name
     FROM projects p
     JOIN organizations o ON p.organization_id = o.id
     WHERE ${whereClause}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    projectNumber: r.project_number,
    name: r.name,
    description: r.description,
    category: r.category,
    status: r.status,
    progress: r.progress,
    tasksCompleted: r.tasks_completed,
    totalTasks: r.total_tasks,
    startDate: r.start_date?.toISOString?.()?.split("T")[0] ?? null,
    dueDate: r.due_date?.toISOString?.()?.split("T")[0] ?? null,
    createdAt: r.created_at?.toISOString?.() ?? "",
    updatedAt: r.updated_at?.toISOString?.() ?? "",
    clientId: r.client_id,
    clientName: r.client_name,
  }));

  return { data, total, page, limit };
}

/** Get single project with tasks and assignees. [R13: no is_active filter] */
export async function getProject(projectId: string) {
  const projectResult = await query(
    `SELECT
       p.id, p.organization_id, p.planner_plan_id, p.project_number,
       p.name, p.description, p.category, p.status, p.progress,
       p.tasks_completed, p.total_tasks, p.start_date, p.due_date,
       p.created_at, p.updated_at,
       o.name AS client_name
     FROM projects p
     JOIN organizations o ON p.organization_id = o.id
     WHERE p.id = $1`,
    [projectId],
  );

  if (!projectResult.rows[0]) return null;
  const p = projectResult.rows[0];

  const tasksResult = await query(
    `SELECT id, planner_task_id, name, description, status, priority,
       assigned_to_name, assigned_to_email, due_date, completed_at,
       created_at, updated_at
     FROM project_tasks WHERE project_id = $1
     ORDER BY created_at ASC`,
    [projectId],
  );

  const assigneesResult = await query(
    `SELECT id, name, initials, email, role
     FROM project_assignees WHERE project_id = $1
     ORDER BY name ASC`,
    [projectId],
  );

  return {
    id: p.id,
    organizationId: p.organization_id,
    plannerPlanId: p.planner_plan_id,
    projectNumber: p.project_number,
    name: p.name,
    description: p.description,
    category: p.category,
    status: p.status,
    progress: p.progress,
    tasksCompleted: p.tasks_completed,
    totalTasks: p.total_tasks,
    startDate: p.start_date?.toISOString?.()?.split("T")[0] ?? null,
    dueDate: p.due_date?.toISOString?.()?.split("T")[0] ?? null,
    createdAt: p.created_at?.toISOString?.() ?? "",
    updatedAt: p.updated_at?.toISOString?.() ?? "",
    clientName: p.client_name,
    tasks: tasksResult.rows.map((t) => ({
      id: t.id,
      plannerTaskId: t.planner_task_id,
      name: t.name,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedToName: t.assigned_to_name,
      assignedToEmail: t.assigned_to_email,
      dueDate: t.due_date?.toISOString?.()?.split("T")[0] ?? null,
      completedAt: t.completed_at?.toISOString?.() ?? null,
      createdAt: t.created_at?.toISOString?.() ?? "",
      updatedAt: t.updated_at?.toISOString?.() ?? "",
    })),
    assignees: assigneesResult.rows.map((a) => ({
      id: a.id,
      name: a.name,
      initials: a.initials,
      email: a.email,
      role: a.role,
    })),
  };
}

/** Cross-client project summary. [R11: is_active=true] */
export async function getProjectStats(filters: { clientId?: string } = {}) {
  const { clientId } = filters;

  const conditions: string[] = ["o.is_active = true"]; // R11
  const params: unknown[] = [];
  let idx = 1;

  if (clientId) {
    conditions.push(`p.organization_id = $${idx++}`);
    params.push(clientId);
  }

  const whereClause = conditions.join(" AND ");

  const result = await query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE p.status = 'On Track') AS on_track,
       COUNT(*) FILTER (WHERE p.status = 'At Risk') AS at_risk,
       COUNT(*) FILTER (WHERE p.status = 'Delayed') AS delayed,
       COALESCE(AVG(p.progress), 0) AS avg_progress,
       COALESCE(SUM(p.tasks_completed), 0) AS total_tasks_completed,
       COALESCE(SUM(p.total_tasks), 0) AS total_tasks_count
     FROM projects p
     JOIN organizations o ON p.organization_id = o.id
     WHERE ${whereClause}`,
    params,
  );

  const r = result.rows[0];
  return {
    total: parseInt(r.total, 10),
    onTrack: parseInt(r.on_track, 10),
    atRisk: parseInt(r.at_risk, 10),
    delayed: parseInt(r.delayed, 10),
    avgProgress: Math.round(parseFloat(r.avg_progress) || 0),
    totalTasksCompleted: parseInt(r.total_tasks_completed, 10),
    totalTasksCount: parseInt(r.total_tasks_count, 10),
  };
}

/** Create a task in a project. Returns the new task row. [R15: parameterized] */
export async function createTask(
  projectId: string,
  organizationId: string,
  data: {
    name: string;
    status?: string;
    priority?: string;
    assignedToName?: string;
    assignedToEmail?: string;
    dueDate?: string;
    description?: string;
  },
) {
  const plannerTaskId = `mgmt-${crypto.randomUUID().slice(0, 8)}`;

  const result = await query(
    `INSERT INTO project_tasks
       (project_id, organization_id, planner_task_id, name, description, status, priority,
        assigned_to_name, assigned_to_email, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, project_id, planner_task_id, name, description, status, priority,
       assigned_to_name, assigned_to_email, due_date, created_at`,
    [
      projectId,
      organizationId,
      plannerTaskId,
      data.name,
      data.description ?? null,
      data.status ?? "To Do",
      data.priority ?? "Medium",
      data.assignedToName ?? null,
      data.assignedToEmail ?? null,
      data.dueDate ?? null,
    ],
  );

  return result.rows[0] ?? null;
}

/** Update a task. Returns the updated row. [R15: parameterized] */
export async function updateTask(
  taskId: string,
  data: {
    name?: string;
    status?: string;
    priority?: string;
    assignedToName?: string;
    assignedToEmail?: string;
    dueDate?: string;
    description?: string;
  },
) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    name: "name",
    status: "status",
    priority: "priority",
    assignedToName: "assigned_to_name",
    assignedToEmail: "assigned_to_email",
    dueDate: "due_date",
    description: "description",
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    const value = data[key as keyof typeof data];
    if (value !== undefined) {
      fields.push(`${col} = $${idx++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  // If status changed to Complete, set completed_at
  if (data.status === "Complete") {
    fields.push(`completed_at = now()`);
  } else if (data.status && data.status !== "Complete") {
    fields.push(`completed_at = NULL`);
  }

  fields.push("updated_at = now()");
  params.push(taskId);

  const result = await query(
    `UPDATE project_tasks SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, project_id, planner_task_id, name, status, priority,
       assigned_to_name, assigned_to_email, due_date, completed_at, updated_at`,
    params,
  );

  return result.rows[0] ?? null;
}

/** Delete a task. Returns true if deleted. */
export async function deleteTask(taskId: string) {
  const result = await query(
    `DELETE FROM project_tasks WHERE id = $1 RETURNING id`,
    [taskId],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Get a single task by ID (for ownership checks). */
export async function getTaskById(taskId: string) {
  const result = await query(
    `SELECT id, project_id, organization_id, assigned_to_email, status
     FROM project_tasks WHERE id = $1`,
    [taskId],
  );
  return result.rows[0] ?? null;
}
