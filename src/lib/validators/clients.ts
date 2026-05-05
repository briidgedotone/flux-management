import { z } from "zod";

export const clientListSchema = z.object({
  industry: z.string().max(100).optional(),
  search: z.string().max(200).trim().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(["companyName", "openTickets"]).default("companyName"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const clientIdSchema = z.object({
  id: z.string().min(1),
});

export const clientUpdateSchema = z.object({
  primaryContactName: z.string().max(200).trim().optional(),
  primaryContactEmail: z.string().email().max(200).optional(),
  primaryContactPhone: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export const clientStatsSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});
