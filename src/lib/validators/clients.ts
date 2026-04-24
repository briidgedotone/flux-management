import { z } from "zod";

export const clientListSchema = z.object({
  industry: z.string().max(100).optional(),
  healthScore: z.enum(["healthy", "at-risk", "critical"]).optional(),
  contractStatus: z.enum(["active", "expiring", "expired"]).optional(),
  search: z.string().max(200).trim().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(["companyName", "monthlyRevenue", "healthScore", "contractStatus", "openTickets", "slaCompliance"]).default("companyName"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});

export const clientUpdateSchema = z.object({
  monthlyRevenue: z.number().min(0).optional(),
  contractStatus: z.enum(["active", "expiring", "expired"]).optional(),
  contractStartDate: z.string().date().optional(),
  contractEndDate: z.string().date().optional(),
  healthScore: z.enum(["healthy", "at-risk", "critical"]).optional(),
  slaTarget: z.number().int().min(0).max(100).optional(),
  primaryContactName: z.string().max(200).trim().optional(),
  primaryContactEmail: z.string().email().max(200).optional(),
  primaryContactPhone: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export const clientStatsSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});
