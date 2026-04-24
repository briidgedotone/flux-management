// GET /api/reports/revenue — Revenue report (co-ceo/director only)
import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { reportRangeSchema } from "@/lib/validators/reports";
import { getRevenueReport } from "@/lib/db/queries/reports";

export async function GET(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async () => {
    try {
      const params = reportRangeSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
      const range = params.success ? params.data.range : "30d";
      const report = await getRevenueReport(range);
      return successResponse(report);
    } catch (err) {
      console.error("[reports] revenue failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
