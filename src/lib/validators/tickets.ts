import { z } from "zod";

export const ticketListSchema = z.object({
  status: z.enum(["Open", "Pending", "Closed"]).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  clientId: z.string().uuid().optional(),
  assignee: z.string().max(200).optional(),
  search: z.string().max(200).trim().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["created_at", "updated_at", "priority", "status", "subject"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const ticketIdSchema = z.object({
  id: z.string().uuid(),
});

export const ticketStatsSchema = z.object({
  clientId: z.string().uuid().optional(),
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export const internalNoteSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export const chartDataSchema = z.object({
  clientId: z.string().uuid().nullable().optional(),
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});
