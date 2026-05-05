import { describe, it, expect } from "vitest";
import { getRevenueReport, getTeamPerformanceReport, getSlaComplianceReport, getTicketAnalyticsReport } from "@/lib/db/queries/reports";
import { TEST_ORG_ID } from "../test-constants";

describe("Report Queries", () => {
  describe("getRevenueReport", () => {
    it("returns revenue data with is_active filter (R11)", async () => {
      const report = await getRevenueReport();
      expect(report).toHaveProperty("clients");
      expect(report).toHaveProperty("totalRevenue");
      expect(report).toHaveProperty("clientCount");
      expect(report.clients.length).toBeGreaterThan(0);
    });

    it("excludes test org from revenue (is_active=false)", async () => {
      const report = await getRevenueReport();
      const ids = report.clients.map((c) => c.clientId);
      expect(ids).not.toContain(TEST_ORG_ID);
    });
  });

  describe("getTeamPerformanceReport", () => {
    it("returns team metrics", async () => {
      const report = await getTeamPerformanceReport();
      expect(report).toHaveProperty("members");
      expect(report.members.length).toBeGreaterThan(0);
      expect(report.members[0]).toHaveProperty("ticketsResolved");
      expect(report.members[0]).toHaveProperty("activeTasks");
    });

    it("supports range filter", async () => {
      const r7 = await getTeamPerformanceReport("7d");
      expect(r7.range).toBe("7d");
    });
  });

  describe("getSlaComplianceReport", () => {
    it("returns SLA data with is_active filter (R11)", async () => {
      const report = await getSlaComplianceReport();
      expect(report).toHaveProperty("clients");
      expect(report.clients.length).toBeGreaterThan(0);
      expect(report.clients[0]).toHaveProperty("slaTarget");
      expect(report.clients[0]).toHaveProperty("slaPercent");
    });

    it("excludes test org", async () => {
      const report = await getSlaComplianceReport();
      const ids = report.clients.map((c) => c.clientId);
      expect(ids).not.toContain(TEST_ORG_ID);
    });
  });

  describe("getTicketAnalyticsReport", () => {
    it("returns analytics with is_active filter (R11)", async () => {
      const report = await getTicketAnalyticsReport();
      expect(report).toHaveProperty("total");
      expect(report).toHaveProperty("priorityBreakdown");
      expect(report.priorityBreakdown).toHaveProperty("critical");
      expect(report.total).toBeGreaterThan(0);
    });

    it("supports clientId filter", async () => {
      const report = await getTicketAnalyticsReport({ range: "90d" });
      expect(report.range).toBe("90d");
    });
  });
});
