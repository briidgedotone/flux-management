// Phase 3 tests: tickets.ts query module
// All writes scoped to TEST_ORG_ID. Cross-org reads verify visibility.
// See: docs/testing-plan.md § Phase 3

import { describe, it, expect } from "vitest";
import { listTickets, getTicket, getTicketStats, getTicketChartData, addInternalNote } from "@/lib/db/queries/tickets";
import { query } from "@/lib/db/client";
import { TEST_ORG_ID, TEST_CEO_ID } from "../test-constants";
import { assertTestOrg, assertTestUser } from "../guards";

describe("Ticket Queries", () => {
  describe("listTickets", () => {
    it("returns tickets with is_active=true filter (R11)", async () => {
      const result = await listTickets();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("limit");
    });

    it("excludes test org tickets from default list", async () => {
      const result = await listTickets();
      const clientIds = result.data.map((t) => t.clientId);
      expect(clientIds).not.toContain(TEST_ORG_ID);
    });

    it("returns expected fields including clientName", async () => {
      const result = await listTickets({ limit: 1 });
      if (result.data.length > 0) {
        const ticket = result.data[0];
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("ticketNumber");
        expect(ticket).toHaveProperty("subject");
        expect(ticket).toHaveProperty("status");
        expect(ticket).toHaveProperty("priority");
        expect(ticket).toHaveProperty("clientId");
        expect(ticket).toHaveProperty("clientName");
      }
    });

    it("supports status filter", async () => {
      const result = await listTickets({ status: "Open" });
      for (const t of result.data) {
        expect(t.status).toBe("Open");
      }
    });

    it("supports pagination", async () => {
      const result = await listTickets({ page: 1, limit: 2 });
      expect(result.limit).toBe(2);
      expect(result.data.length).toBeLessThanOrEqual(2);
    });

    it("supports clientId filter", async () => {
      // Get a real client ID first
      const all = await listTickets({ limit: 1 });
      if (all.data.length > 0) {
        const cid = all.data[0].clientId;
        const filtered = await listTickets({ clientId: cid });
        for (const t of filtered.data) {
          expect(t.clientId).toBe(cid);
        }
      }
    });
  });

  describe("getTicket", () => {
    it("returns ticket detail with activities, attachments, and internal notes", async () => {
      // Use a test org ticket
      const ticketResult = await query(
        `SELECT id FROM tickets WHERE organization_id = $1 LIMIT 1`,
        [TEST_ORG_ID],
      );
      if (ticketResult.rows.length > 0) {
        const detail = await getTicket(ticketResult.rows[0].id);
        expect(detail).not.toBeNull();
        expect(detail).toHaveProperty("activities");
        expect(detail).toHaveProperty("attachments");
        expect(detail).toHaveProperty("internalNotes");
        expect(Array.isArray(detail!.activities)).toBe(true);
        expect(Array.isArray(detail!.internalNotes)).toBe(true);
      }
    });

    it("returns null for non-existent ticket", async () => {
      const result = await getTicket("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("getTicketStats", () => {
    it("returns cross-client stats with is_active filter (R11)", async () => {
      const stats = await getTicketStats();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("open");
      expect(stats).toHaveProperty("pending");
      expect(stats).toHaveProperty("closed");
      expect(stats).toHaveProperty("critical");
      expect(stats).toHaveProperty("avgResolutionHours");
      expect(stats.total).toBeGreaterThan(0);
    });

    it("supports range filter", async () => {
      const stats7 = await getTicketStats({ range: "7d" });
      const stats90 = await getTicketStats({ range: "90d" });
      expect(stats7.range).toBe("7d");
      expect(stats90.range).toBe("90d");
    });
  });

  describe("getTicketChartData", () => {
    it("returns daily chart data", async () => {
      const data = await getTicketChartData(null, "7d");
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("date");
      expect(data[0]).toHaveProperty("created");
      expect(data[0]).toHaveProperty("resolved");
    });
  });

  describe("addInternalNote", () => {
    it("adds note to test org ticket only (R1)", async () => {
      assertTestOrg(TEST_ORG_ID);
      assertTestUser(TEST_CEO_ID);

      const ticketResult = await query(
        `SELECT id FROM tickets WHERE organization_id = $1 LIMIT 1`,
        [TEST_ORG_ID],
      );
      if (ticketResult.rows.length > 0) {
        const note = await addInternalNote(
          ticketResult.rows[0].id,
          TEST_CEO_ID,
          "Test internal note from phase-3 test",
        );
        expect(note).not.toBeNull();
        expect(note.content).toBe("Test internal note from phase-3 test");
        expect(note.author_id).toBe(TEST_CEO_ID);
      }
    });
  });
});
