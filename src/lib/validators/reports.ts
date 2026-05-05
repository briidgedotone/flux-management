import { z } from "zod";

export const reportRangeSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export const ticketAnalyticsSchema = z.object({
  clientId: z.string().uuid().optional(),
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});
