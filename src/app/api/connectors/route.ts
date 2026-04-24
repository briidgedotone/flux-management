// GET /api/connectors — Integration statuses
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listConnectorStatuses } from "@/lib/db/queries/connectors";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const statuses = await listConnectorStatuses();
      return successResponse(statuses);
    } catch (err) {
      console.error("[connectors] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
