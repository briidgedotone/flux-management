// PUT /api/contact-submissions/:id — Update status (co-ceo/director only)
import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { submissionIdSchema, submissionUpdateSchema } from "@/lib/validators/contact-submissions";
import { updateSubmissionStatus } from "@/lib/db/queries/contact-submissions";
import { logActivity } from "@/lib/db/queries/activity-log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const { id } = await params;
      const parsedId = submissionIdSchema.safeParse({ id });
      if (!parsedId.success) return Errors.VALIDATION("Invalid submission ID");

      const body = submissionUpdateSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const result = await updateSubmissionStatus(parsedId.data.id, body.data.status, ctx.user.id);
      if (!result) return Errors.NOT_FOUND();

      await logActivity(ctx.user.id, "updated", "contact_submission", parsedId.data.id, null, `Updated contact submission status to ${body.data.status}`);

      return successResponse(result);
    } catch (err) {
      console.error("[contact-submissions] update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
