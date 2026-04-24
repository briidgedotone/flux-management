import { z } from "zod";

export const teamMemberIdSchema = z.object({
  id: z.string().uuid(),
});

export const teamUpdateSchema = z.object({
  capacityHoursWeek: z.number().int().min(0).max(168).optional(),
  utilizationTarget: z.number().int().min(0).max(100).optional(),
  department: z.string().max(100).trim().optional(),
  status: z.enum(["active", "invited", "inactive"]).optional(),
  hireDate: z.string().date().optional(),
});
