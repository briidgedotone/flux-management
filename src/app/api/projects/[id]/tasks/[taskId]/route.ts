// PUT /api/projects/:id/tasks/:taskId — Update task
// DELETE /api/projects/:id/tasks/:taskId — Delete task
// Security: withManagementAuth [R23], audit log [R29]
// Employee: own tasks only. Co-ceo/director: any task.

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { updateTaskSchema, taskIdSchema } from "@/lib/validators/projects";
import { getTaskById, updateTask, deleteTask } from "@/lib/db/queries/projects";
import { logActivity } from "@/lib/db/queries/activity-log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const { taskId } = await params;
      const parsedId = taskIdSchema.safeParse({ taskId });
      if (!parsedId.success) return Errors.VALIDATION("Invalid task ID");

      const body = updateTaskSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      // Verify task exists
      const existing = await getTaskById(parsedId.data.taskId);
      if (!existing) return Errors.NOT_FOUND();

      // Employee: own tasks only [BP §5]
      if (ctx.role === "employee" && existing.assigned_to_email !== ctx.user.email) {
        return Errors.FORBIDDEN("You can only update your own tasks");
      }

      const updated = await updateTask(parsedId.data.taskId, body.data);

      // TODO: Planner write-back (background) — Step 5.1

      // R29: Audit log
      await logActivity(
        ctx.user.id,
        "updated",
        "task",
        parsedId.data.taskId,
        existing.organization_id,
        `Updated task in project`,
        body.data,
      );

      return successResponse(updated);
    } catch (err) {
      console.error("[projects] update task failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const { taskId } = await params;
      const parsedId = taskIdSchema.safeParse({ taskId });
      if (!parsedId.success) return Errors.VALIDATION("Invalid task ID");

      // Verify task exists
      const existing = await getTaskById(parsedId.data.taskId);
      if (!existing) return Errors.NOT_FOUND();

      // Employee: own tasks only. Co-ceo/director: any task. [BP §5]
      if (ctx.role === "employee" && existing.assigned_to_email !== ctx.user.email) {
        return Errors.FORBIDDEN("You can only delete your own tasks");
      }

      await deleteTask(parsedId.data.taskId);

      // TODO: Planner delete (background) — Step 5.1

      // R29: Audit log
      await logActivity(
        ctx.user.id,
        "deleted",
        "task",
        parsedId.data.taskId,
        existing.organization_id,
        `Deleted task from project`,
      );

      return successResponse({ deleted: true });
    } catch (err) {
      console.error("[projects] delete task failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
