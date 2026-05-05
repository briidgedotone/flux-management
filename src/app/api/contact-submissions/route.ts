// GET /api/contact-submissions — List submissions (co-ceo/director only)
import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { paginatedResponse, Errors } from "@/lib/api/response";
import { submissionListSchema } from "@/lib/validators/contact-submissions";
import { listSubmissions } from "@/lib/db/queries/contact-submissions";

export async function GET(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async () => {
    try {
      const params = submissionListSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const result = await listSubmissions(params.data);
      return paginatedResponse(result.data, result.total, result.page, result.limit);
    } catch (err) {
      console.error("[contact-submissions] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
