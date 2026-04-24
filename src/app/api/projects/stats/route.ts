// GET /api/projects/stats — Cross-client project summary
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { projectStatsSchema } from "@/lib/validators/projects";
import { getProjectStats } from "@/lib/db/queries/projects";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = projectStatsSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      const filters = params.success ? params.data : {};

      const stats = await getProjectStats(filters);
      return successResponse(stats);
    } catch (err) {
      console.error("[projects] stats failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
