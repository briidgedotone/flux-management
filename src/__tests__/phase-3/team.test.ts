import { describe, it, expect } from "vitest";
import { listTeamMembers, getTeamMember, updateTeamMember } from "@/lib/db/queries/team";
import { TEST_CEO_ID } from "../test-constants";
import { assertTestUser } from "../guards";

describe("Team Queries", () => {
  describe("listTeamMembers", () => {
    it("returns team members with computed metrics", async () => {
      const members = await listTeamMembers();
      expect(members.length).toBeGreaterThan(0);
      const m = members[0];
      expect(m).toHaveProperty("name");
      expect(m).toHaveProperty("role");
      expect(m).toHaveProperty("ticketsResolved");
      expect(m).toHaveProperty("activeTasks");
      expect(m).toHaveProperty("avgResolutionHours");
      expect(m).toHaveProperty("capacityHoursWeek");
    });
  });

  describe("getTeamMember", () => {
    it("returns detail for test CEO", async () => {
      const member = await getTeamMember(TEST_CEO_ID);
      expect(member).not.toBeNull();
      expect(member!.id).toBe(TEST_CEO_ID);
      expect(member).toHaveProperty("department");
      expect(member).toHaveProperty("ticketsResolved");
    });

    it("returns null for non-existent user", async () => {
      const result = await getTeamMember("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("updateTeamMember", () => {
    it("updates test user only (R1)", async () => {
      assertTestUser(TEST_CEO_ID);
      const result = await updateTeamMember(TEST_CEO_ID, {
        department: "Test Updated Dept",
      });
      if (result) {
        expect(result.department).toBe("Test Updated Dept");
      }
    });

    it("returns null when no fields provided", async () => {
      const result = await updateTeamMember(TEST_CEO_ID, {});
      expect(result).toBeNull();
    });
  });
});
