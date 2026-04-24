// POST /api/contact-submissions/webhook — Receive from flux-app contact form
// Security: withWebhookAuth (X-API-Secret), not JWT [EA §Contact Form Webhook]

import { NextRequest } from "next/server";
import { withWebhookAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { webhookSubmissionSchema } from "@/lib/validators/contact-submissions";
import { createSubmission } from "@/lib/db/queries/contact-submissions";

export async function POST(request: NextRequest) {
  return withWebhookAuth(request, async () => {
    try {
      const body = webhookSubmissionSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const submission = await createSubmission(body.data);
      if (!submission) return Errors.INTERNAL();

      // TODO: Create notification for co-ceo/director (Step 5.4)

      return successResponse(submission, 201);
    } catch (err) {
      console.error("[webhook] submission failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
