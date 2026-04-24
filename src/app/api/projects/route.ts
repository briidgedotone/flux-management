// GET /api/projects — List all projects across clients
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { paginatedResponse, Errors } from "@/lib/api/response";
import { projectListSchema } from "@/lib/validators/projects";
import { listProjects } from "@/lib/db/queries/projects";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = projectListSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const result = await listProjects(params.data);
      return paginatedResponse(result.data, result.total, result.page, result.limit);
    } catch (err) {
      console.error("[projects] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
