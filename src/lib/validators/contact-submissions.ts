import { z } from "zod";

export const submissionListSchema = z.object({
  status: z.enum(["new", "reviewed", "responded"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const submissionIdSchema = z.object({
  id: z.string().uuid(),
});

export const submissionUpdateSchema = z.object({
  status: z.enum(["new", "reviewed", "responded"]),
});

export const webhookSubmissionSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  serviceInterest: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
});
