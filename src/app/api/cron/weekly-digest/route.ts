// GET /api/cron/weekly-digest — Automated weekly management summary email
// Called by Vercel Cron or external scheduler. Protected by CRON_SECRET header.
// PRD U11, A4, R5: "Weekly summary digest emailed to management team"

import { NextRequest } from "next/server";
import { successResponse, Errors } from "@/lib/api/response";
import { query } from "@/lib/db/client";
import { getTicketStats } from "@/lib/db/queries/tickets";
import { getProjectStats } from "@/lib/db/queries/projects";
import { backgroundSendEmail } from "@/lib/integrations/mail/sender";
import { buildWeeklyDigestEmail } from "@/lib/integrations/mail/weekly-digest";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  // Verify cron secret — same pattern as webhook auth
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return Errors.UNAUTHORIZED();
  }

  try {
    // Gather data for last 7 days
    const [ticketStats, projectStats] = await Promise.all([
      getTicketStats({ range: "7d" }),
      getProjectStats(),
    ]);

    // Get recipients — co-ceo and director users
    const managers = await query(
      `SELECT id, email, name FROM users
       WHERE role IN ('co-ceo', 'director') AND is_active = true
       AND email NOT LIKE '%@test.flux.internal'`,
    );

    if (managers.rows.length === 0) {
      return successResponse({ sent: 0, reason: "no recipients" });
    }

    const htmlBody = buildWeeklyDigestEmail(ticketStats, projectStats);
    const weekOf = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // ?test=true sends only to development@flux.tech instead of real recipients
    const isTest = request.nextUrl.searchParams.get("test") === "true";
    const recipients = isTest
      ? [{ email: "development@flux.tech" }]
      : managers.rows;

    let sent = 0;
    for (const recipient of recipients) {
      backgroundSendEmail({
        to: recipient.email,
        subject: `Flux Weekly Digest — ${weekOf}`,
        htmlBody,
      });
      sent++;
    }

    return successResponse({ sent, recipients: recipients.map((r) => r.email) });
  } catch (err) {
    console.error("[cron/weekly-digest] failed:", (err as Error).message);
    return Errors.INTERNAL();
  }
}
