import { z } from "zod";

export const projectListSchema = z.object({
  status: z.enum(["On Track", "At Risk", "Delayed"]).optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().max(200).trim().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["name", "status", "progress", "due_date", "created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const projectIdSchema = z.object({
  id: z.string().uuid(),
});

export const projectStatsSchema = z.object({
  clientId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
  name: z.string().min(1).max(500).trim(),
  status: z.enum(["To Do", "In Progress", "Review", "Complete"]).default("To Do"),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).default("Medium"),
  assignedToName: z.string().max(200).optional(),
  assignedToEmail: z.string().email().max(200).optional(),
  dueDate: z.string().date().optional(),
  description: z.string().max(2000).optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(500).trim().optional(),
  status: z.enum(["To Do", "In Progress", "Review", "Complete"]).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  assignedToName: z.string().max(200).optional(),
  assignedToEmail: z.string().email().max(200).optional(),
  dueDate: z.string().date().optional(),
  description: z.string().max(2000).optional(),
});

export const taskIdSchema = z.object({
  taskId: z.string().uuid(),
});
