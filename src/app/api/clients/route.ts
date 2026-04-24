// GET /api/clients — List all clients
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, paginatedResponse, Errors } from "@/lib/api/response";
import { clientListSchema } from "@/lib/validators/clients";
import { listClients } from "@/lib/db/queries/clients";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const params = clientListSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const result = await listClients(params.data);
      return paginatedResponse(result.data, result.total, result.page, result.limit);
    } catch (err) {
      console.error("[clients] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
