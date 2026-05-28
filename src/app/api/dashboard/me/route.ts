// GET /api/dashboard/me — Personal KPIs for the logged-in employee
// Returns metrics scoped to the current user: their tickets, tasks, resolution time

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { query } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const { email, name } = ctx.user;

      const [ticketStats, taskStats, recentTickets, myTasks] = await Promise.all([
        // Ticket stats for this user
        query(
          `SELECT
             COUNT(*) FILTER (WHERE status IN ('Open','Pending')) AS open_count,
             COUNT(*) FILTER (WHERE status = 'Closed'
               AND updated_at >= date_trunc('month', now())) AS resolved_this_month,
             COUNT(*) FILTER (WHERE status = 'Closed') AS total_resolved,
             COALESCE(AVG(resolution_time_hours) FILTER (WHERE resolution_time_hours IS NOT NULL), 0) AS avg_resolution_hours
           FROM tickets
           WHERE assigned_to_email = $1 OR assigned_to_name = $2`,
          [email, name],
        ),
        // Task stats for this user
        query(
          `SELECT
             COUNT(*) FILTER (WHERE status != 'Complete') AS active_tasks,
             COUNT(*) FILTER (WHERE status = 'Complete') AS completed_tasks,
             COUNT(*) FILTER (WHERE status != 'Complete' AND due_date < now()) AS overdue_tasks
           FROM project_tasks
           WHERE assigned_to_email = $1 OR assigned_to_name = $2`,
          [email, name],
        ),
        // Recent tickets assigned to this user
        query(
          `SELECT t.id, t.ticket_number, t.subject, t.status, t.priority, t.created_at,
                  o.name AS client_name
           FROM tickets t
           JOIN organizations o ON o.id = t.organization_id
           WHERE (t.assigned_to_email = $1 OR t.assigned_to_name = $2)
             AND t.status IN ('Open','Pending')
           ORDER BY t.created_at DESC
           LIMIT 5`,
          [email, name],
        ),
        // Active tasks assigned to this user
        query(
          `SELECT pt.id, pt.title, pt.status, pt.due_date, pt.priority,
                  p.name AS project_name, o.name AS client_name
           FROM project_tasks pt
           JOIN projects p ON p.id = pt.project_id
           JOIN organizations o ON o.id = p.organization_id
           WHERE (pt.assigned_to_email = $1 OR pt.assigned_to_name = $2)
             AND pt.status != 'Complete'
           ORDER BY pt.due_date ASC NULLS LAST
           LIMIT 8`,
          [email, name],
        ),
      ]);

      const ts = ticketStats.rows[0];
      const tsk = taskStats.rows[0];

      // Team average resolution time for comparison
      const teamAvg = await query(
        `SELECT COALESCE(AVG(resolution_time_hours), 0) AS avg
         FROM tickets WHERE resolution_time_hours IS NOT NULL`,
      );

      return successResponse({
        tickets: {
          open: parseInt(ts.open_count, 10),
          resolvedThisMonth: parseInt(ts.resolved_this_month, 10),
          totalResolved: parseInt(ts.total_resolved, 10),
          avgResolutionHours: parseFloat(ts.avg_resolution_hours) || 0,
          teamAvgResolutionHours: parseFloat(teamAvg.rows[0]?.avg) || 0,
        },
        tasks: {
          active: parseInt(tsk.active_tasks, 10),
          completed: parseInt(tsk.completed_tasks, 10),
          overdue: parseInt(tsk.overdue_tasks, 10),
        },
        recentTickets: recentTickets.rows.map((r) => ({
          id: r.id,
          ticketNumber: r.ticket_number,
          subject: r.subject,
          status: r.status,
          priority: r.priority,
          createdAt: r.created_at?.toISOString() ?? null,
          clientName: r.client_name,
        })),
        myTasks: myTasks.rows.map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          dueDate: r.due_date?.toISOString?.()?.split("T")[0] ?? null,
          priority: r.priority,
          projectName: r.project_name,
          clientName: r.client_name,
        })),
      });
    } catch (err) {
      console.error("[dashboard/me] failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
