import { z } from "zod";

export const notificationListSchema = z.object({
  type: z.enum(["task_assignment", "ticket_escalation", "contact_form", "health_alert", "team_update", "system"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
});
