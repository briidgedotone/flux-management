// GET /api/tickets/stats — Cross-client ticket metrics
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { ticketStatsSchema } from "@/lib/validators/tickets";
import { getTicketStats } from "@/lib/db/queries/tickets";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = ticketStatsSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const stats = await getTicketStats(params.data);
      return successResponse(stats);
    } catch (err) {
      console.error("[tickets] stats failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
