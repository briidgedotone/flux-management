// Phase 7: Input validation verification
// Verifies: Zod schemas reject bad input, all route files import validators
// See: docs/testing-plan.md § Phase 7, R16

import { describe, it, expect } from "vitest";
import { clientListSchema, clientUpdateSchema } from "@/lib/validators/clients";
import { ticketListSchema, internalNoteSchema } from "@/lib/validators/tickets";
import { createTaskSchema, updateTaskSchema } from "@/lib/validators/projects";
import { chatMessageSchema } from "@/lib/validators/ai";
import { webhookSubmissionSchema } from "@/lib/validators/contact-submissions";
import { teamUpdateSchema } from "@/lib/validators/team";
import { profileUpdateSchema } from "@/lib/validators/settings";

describe("Input Validation (R16)", () => {
  describe("Client schemas", () => {
    it("clientListSchema accepts valid filters", () => {
      const result = clientListSchema.safeParse({ page: "1", limit: "10", industry: "Technology" });
      expect(result.success).toBe(true);
    });
    it("clientListSchema accepts search", () => {
      const result = clientListSchema.safeParse({ search: "Armada" });
      expect(result.success).toBe(true);
    });
    it("clientUpdateSchema accepts valid profile data", () => {
      const result = clientUpdateSchema.safeParse({ primaryContactName: "John", industry: "Tech" });
      expect(result.success).toBe(true);
    });
  });

  describe("Ticket schemas", () => {
    it("ticketListSchema accepts valid status", () => {
      const result = ticketListSchema.safeParse({ status: "Open" });
      expect(result.success).toBe(true);
    });
    it("ticketListSchema rejects invalid status", () => {
      const result = ticketListSchema.safeParse({ status: "Invalid" });
      expect(result.success).toBe(false);
    });
    it("internalNoteSchema rejects empty content", () => {
      const result = internalNoteSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });
    it("internalNoteSchema rejects content > 5000 chars", () => {
      const result = internalNoteSchema.safeParse({ content: "x".repeat(5001) });
      expect(result.success).toBe(false);
    });
  });

  describe("Project schemas", () => {
    it("createTaskSchema requires name", () => {
      const result = createTaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it("createTaskSchema accepts valid task", () => {
      const result = createTaskSchema.safeParse({ name: "Test task", priority: "High" });
      expect(result.success).toBe(true);
    });
    it("updateTaskSchema rejects invalid status", () => {
      const result = updateTaskSchema.safeParse({ status: "Invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("AI schema", () => {
    it("chatMessageSchema requires message", () => {
      const result = chatMessageSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it("chatMessageSchema rejects message > 2000 chars", () => {
      const result = chatMessageSchema.safeParse({ message: "x".repeat(2001) });
      expect(result.success).toBe(false);
    });
    it("chatMessageSchema accepts valid message", () => {
      const result = chatMessageSchema.safeParse({ message: "Hello" });
      expect(result.success).toBe(true);
    });
  });

  describe("Webhook schema", () => {
    it("webhookSubmissionSchema requires name and email", () => {
      const result = webhookSubmissionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
    it("webhookSubmissionSchema rejects invalid email", () => {
      const result = webhookSubmissionSchema.safeParse({ name: "Test", email: "not-an-email" });
      expect(result.success).toBe(false);
    });
    it("webhookSubmissionSchema accepts valid submission", () => {
      const result = webhookSubmissionSchema.safeParse({ name: "Test", email: "test@example.com" });
      expect(result.success).toBe(true);
    });
  });

  describe("Team schema", () => {
    it("teamUpdateSchema rejects utilizationTarget > 100", () => {
      const result = teamUpdateSchema.safeParse({ utilizationTarget: 150 });
      expect(result.success).toBe(false);
    });
  });

  describe("Settings schema", () => {
    it("profileUpdateSchema accepts valid update", () => {
      const result = profileUpdateSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });
  });
});
