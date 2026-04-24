// POST /api/tickets/:id/notes — Add internal note (management-only)
// Security: withManagementAuth [R23], audit log [R29]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { ticketIdSchema, internalNoteSchema } from "@/lib/validators/tickets";
import { getTicket, addInternalNote } from "@/lib/db/queries/tickets";
import { logActivity } from "@/lib/db/queries/activity-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const { id } = await params;
      const parsedId = ticketIdSchema.safeParse({ id });
      if (!parsedId.success) return Errors.VALIDATION("Invalid ticket ID");

      const body = internalNoteSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      // Verify ticket exists
      const ticket = await getTicket(parsedId.data.id);
      if (!ticket) return Errors.NOT_FOUND();

      const note = await addInternalNote(parsedId.data.id, ctx.user.id, body.data.content);

      // R29: Audit log
      await logActivity(
        ctx.user.id,
        "created",
        "note",
        note.id,
        ticket.organizationId,
        `Added internal note to ticket ${ticket.ticketNumber}`,
      );

      return successResponse(note, 201);
    } catch (err) {
      console.error("[tickets] add note failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}
