// GET /api/tickets/chart-data — Daily ticket created/resolved counts for charts
// PRD M9: "ticket activity metrics displayed on a 7-day rolling chart"

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { getTicketChartData } from "@/lib/db/queries/tickets";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const range = (request.nextUrl.searchParams.get("range") ?? "7d") as "7d" | "30d" | "90d";
      const clientId = request.nextUrl.searchParams.get("clientId") ?? null;
      const data = await getTicketChartData(clientId, range);
      return successResponse(data);
    } catch (err) {
      console.error("[tickets] chart-data failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
