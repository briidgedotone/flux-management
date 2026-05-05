import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  phone: z.string().max(50).optional(),
  notificationPrefs: z.record(z.string(), z.boolean()).optional(),
});
