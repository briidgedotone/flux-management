// POST /api/contact-submissions/webhook — Receive from flux-app contact form
// Security: withWebhookAuth (X-API-Secret), not JWT [EA §Contact Form Webhook]
// PRD I5: "Notify internal team when contact form is submitted"

import { NextRequest, NextResponse } from "next/server";
import { withWebhookAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { webhookSubmissionSchema } from "@/lib/validators/contact-submissions";
import { createSubmission } from "@/lib/db/queries/contact-submissions";
import { createNotification } from "@/lib/db/queries/notifications";
import { query } from "@/lib/db/client";
import { backgroundSendEmail, contactFormAlertEmail } from "@/lib/integrations/mail/sender";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://flux.tech",
  "https://www.flux.tech",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Secret",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const response = await withWebhookAuth(request, async () => {
    try {
      const body = webhookSubmissionSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const submission = await createSubmission(body.data);
      if (!submission) return Errors.INTERNAL();

      // Notify all co-ceo and director users
      const managers = await query(
        `SELECT id, email, name FROM users
         WHERE role IN ('co-ceo', 'director') AND is_active = true
         AND email NOT LIKE '%@test.flux.internal'`,
      );

      for (const mgr of managers.rows) {
        // In-app notification
        await createNotification(mgr.id, {
          type: "contact_form",
          title: `New lead: ${body.data.name}`,
          description: `${body.data.name}${body.data.company ? ` from ${body.data.company}` : ""} submitted the contact form.`,
          link: "/contact-submissions",
        });

        // Email notification (non-blocking)
        backgroundSendEmail({
          to: mgr.email,
          subject: `New Contact Form Submission — ${body.data.name}`,
          htmlBody: contactFormAlertEmail(mgr.name, body.data.name, body.data.company ?? ""),
        });
      }

      return successResponse(submission, 201);
    } catch (err) {
      console.error("[webhook] submission failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });

  // Append CORS headers to the response
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}
