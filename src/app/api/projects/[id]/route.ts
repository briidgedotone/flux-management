// GET /api/projects/:id — Project detail with tasks and assignees
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { projectIdSchema } from "@/lib/validators/projects";
import { getProject } from "@/lib/db/queries/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = projectIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid project ID");

      const project = await getProject(parsed.data.id);
      if (!project) return Errors.NOT_FOUND();

      return successResponse(project);
    } catch (err) {
      console.error("[projects] detail failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
