// GET /api/tickets — List all tickets across clients
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { paginatedResponse, Errors } from "@/lib/api/response";
import { ticketListSchema } from "@/lib/validators/tickets";
import { listTickets } from "@/lib/db/queries/tickets";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = ticketListSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const result = await listTickets(params.data);
      return paginatedResponse(result.data, result.total, result.page, result.limit);
    } catch (err) {
      console.error("[tickets] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
