// POST /api/projects/:id/tasks — Create new task
// Security: withManagementAuth [R23], audit log [R29]
// Dual-write: DB immediate + Planner background (Step 5.1) [R33]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { projectIdSchema, createTaskSchema } from "@/lib/validators/projects";
import { getProject, createTask } from "@/lib/db/queries/projects";
import { logActivity } from "@/lib/db/queries/activity-log";
import { backgroundSendEmail, taskAssignmentEmail } from "@/lib/integrations/mail/sender";
import { createPlannerTask, backgroundPlannerWrite } from "@/lib/integrations/graph/planner-write";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const { id } = await params;
      const parsedId = projectIdSchema.safeParse({ id });
      if (!parsedId.success) return Errors.VALIDATION("Invalid project ID");

      const body = createTaskSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      // Verify project exists
      const project = await getProject(parsedId.data.id);
      if (!project) return Errors.NOT_FOUND();

      // DB write (immediate)
      const task = await createTask(parsedId.data.id, project.organizationId, body.data);

      // Planner write-back (background, non-blocking) [R33]
      // Only attempt if project has a real Planner plan ID (not mock/dataverse IDs)
      const planId = project.plannerPlanId;
      if (planId && !planId.startsWith("mock-") && !planId.startsWith("test-")) {
        const priorityMap: Record<string, number> = { Critical: 1, High: 3, Medium: 5, Low: 9 };
        backgroundPlannerWrite("create", () =>
          createPlannerTask(planId, {
            name: body.data.name,
            dueDate: body.data.dueDate ?? undefined,
            priority: priorityMap[body.data.priority ?? "Medium"],
            assigneeEmail: body.data.assignedToEmail ?? undefined,
          }),
        );
      }

      // R29: Audit log
      await logActivity(
        ctx.user.id,
        "created",
        "task",
        task.id,
        project.organizationId,
        `Created task "${body.data.name}" in project ${project.name}`,
      );

      // Email notification to assigned user (non-blocking)
      if (body.data.assignedToEmail && body.data.assignedToName) {
        backgroundSendEmail({
          to: body.data.assignedToEmail,
          subject: `Task Assigned — ${body.data.name}`,
          htmlBody: taskAssignmentEmail(
            body.data.assignedToName,
            body.data.name,
            project.name,
            ctx.user.name,
          ),
        });
      }

      return successResponse(task, 201);
    } catch (err) {
      console.error("[projects] create task failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
