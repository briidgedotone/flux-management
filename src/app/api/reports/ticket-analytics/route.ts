// GET /api/reports/ticket-analytics — Ticket analytics report (co-ceo/director only)
import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { ticketAnalyticsSchema } from "@/lib/validators/reports";
import { getTicketAnalyticsReport } from "@/lib/db/queries/reports";

export async function GET(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async () => {
    try {
      const params = ticketAnalyticsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      const filters = params.success ? params.data : {};
      const report = await getTicketAnalyticsReport(filters);
      return successResponse(report);
    } catch (err) {
      console.error("[reports] ticket-analytics failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
