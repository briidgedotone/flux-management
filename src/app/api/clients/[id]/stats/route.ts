// GET /api/clients/:id/stats — Client-specific KPIs
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { clientIdSchema, clientStatsSchema } from "@/lib/validators/clients";
import { getClientStats } from "@/lib/db/queries/clients";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsedId = clientIdSchema.safeParse({ id });
      if (!parsedId.success) return Errors.VALIDATION("Invalid client ID");

      const parsedRange = clientStatsSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      const range = parsedRange.success ? parsedRange.data.range : "30d";

      const stats = await getClientStats(parsedId.data.id, range);
      return successResponse(stats);
    } catch (err) {
      console.error("[clients] stats failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
