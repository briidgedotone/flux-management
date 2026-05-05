// GET /api/tech-stack — Tech stack data across all clients
// PRD M5: "Display of detailed tech stack information for each client"

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listSoftwareSubscriptions, listInfrastructureItems, listCloudServices, getTechStackStats } from "@/lib/db/queries/tech-stack";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const clientId = request.nextUrl.searchParams.get("clientId") ?? undefined;

      const [software, infrastructure, cloud, stats] = await Promise.all([
        listSoftwareSubscriptions(clientId),
        listInfrastructureItems(clientId),
        listCloudServices(clientId),
        getTechStackStats(),
      ]);

      return successResponse({ software, infrastructure, cloud, stats });
    } catch (err) {
      console.error("[tech-stack] failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
