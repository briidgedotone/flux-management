import { z } from "zod";

export const ticketListSchema = z.object({
  search: z.string().max(200).trim().optional(),
  status: z.enum(["Open", "Pending", "Closed"]).optional(),
  clientId: z.string().min(1).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["created_at", "updated_at", "priority", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const ticketIdSchema = z.object({
  id: z.string().min(1),
});

export const ticketStatsSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
  clientId: z.string().min(1).optional(),
});

export const ticketChartSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("7d"),
  clientId: z.string().min(1).nullable().optional(),
});

export const internalNoteSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});
