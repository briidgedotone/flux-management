// GET /api/tickets/:id — Ticket detail with activities, attachments, internal notes
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { ticketIdSchema } from "@/lib/validators/tickets";
import { getTicket } from "@/lib/db/queries/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = ticketIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid ticket ID");

      const ticket = await getTicket(parsed.data.id);
      if (!ticket) return Errors.NOT_FOUND();

      return successResponse(ticket);
    } catch (err) {
      console.error("[tickets] detail failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
