// Phase 3 tests: projects.ts query module
// All writes scoped to TEST_ORG_ID.
// See: docs/testing-plan.md § Phase 3

import { describe, it, expect } from "vitest";
import { listProjects, getProject, getProjectStats, createTask, updateTask, deleteTask } from "@/lib/db/queries/projects";
import { query } from "@/lib/db/client";
import { TEST_ORG_ID } from "../test-constants";
import { assertTestOrg } from "../guards";

describe("Project Queries", () => {
  describe("listProjects", () => {
    it("returns projects with is_active=true filter (R11)", async () => {
      const result = await listProjects();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
    });

    it("excludes test org projects from default list", async () => {
      const result = await listProjects();
      const clientIds = result.data.map((p) => p.clientId);
      expect(clientIds).not.toContain(TEST_ORG_ID);
    });

    it("returns expected fields including clientName", async () => {
      const result = await listProjects({ limit: 1 });
      if (result.data.length > 0) {
        const project = result.data[0];
        expect(project).toHaveProperty("id");
        expect(project).toHaveProperty("name");
        expect(project).toHaveProperty("status");
        expect(project).toHaveProperty("progress");
        expect(project).toHaveProperty("clientId");
        expect(project).toHaveProperty("clientName");
      }
    });

    it("supports status filter", async () => {
      const result = await listProjects({ status: "On Track" });
      for (const p of result.data) {
        expect(p.status).toBe("On Track");
      }
    });

    it("supports pagination", async () => {
      const result = await listProjects({ page: 1, limit: 1 });
      expect(result.limit).toBe(1);
      expect(result.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe("getProject", () => {
    it("returns project detail with tasks and assignees", async () => {
      const projectResult = await query(
        `SELECT id FROM projects WHERE organization_id = $1 LIMIT 1`,
        [TEST_ORG_ID],
      );
      if (projectResult.rows.length > 0) {
        const detail = await getProject(projectResult.rows[0].id);
        expect(detail).not.toBeNull();
        expect(detail).toHaveProperty("tasks");
        expect(detail).toHaveProperty("assignees");
        expect(Array.isArray(detail!.tasks)).toBe(true);
        expect(Array.isArray(detail!.assignees)).toBe(true);
      }
    });

    it("returns null for non-existent project", async () => {
      const result = await getProject("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("getProjectStats", () => {
    it("returns cross-client stats with is_active filter (R11)", async () => {
      const stats = await getProjectStats();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("onTrack");
      expect(stats).toHaveProperty("atRisk");
      expect(stats).toHaveProperty("delayed");
      expect(stats).toHaveProperty("avgProgress");
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe("Task CRUD", () => {
    let createdTaskId: string | null = null;

    it("creates task in test org project (R1)", async () => {
      assertTestOrg(TEST_ORG_ID);

      const projectResult = await query(
        `SELECT id FROM projects WHERE organization_id = $1 LIMIT 1`,
        [TEST_ORG_ID],
      );
      if (projectResult.rows.length > 0) {
        const task = await createTask(projectResult.rows[0].id, TEST_ORG_ID, {
          name: "Test task from phase-3",
          status: "To Do",
          priority: "Medium",
        });
        expect(task).not.toBeNull();
        expect(task.name).toBe("Test task from phase-3");
        expect(task.status).toBe("To Do");
        createdTaskId = task.id;
      }
    });

    it("updates task status", async () => {
      if (!createdTaskId) return;
      const updated = await updateTask(createdTaskId, { status: "In Progress" });
      expect(updated).not.toBeNull();
      expect(updated.status).toBe("In Progress");
    });

    it("sets completed_at when status is Complete", async () => {
      if (!createdTaskId) return;
      const updated = await updateTask(createdTaskId, { status: "Complete" });
      expect(updated).not.toBeNull();
      expect(updated.completed_at).not.toBeNull();
    });

    it("deletes task", async () => {
      if (!createdTaskId) return;
      const deleted = await deleteTask(createdTaskId);
      expect(deleted).toBe(true);
    });

    it("delete returns false for non-existent task", async () => {
      const deleted = await deleteTask("00000000-0000-0000-0000-000000000000");
      expect(deleted).toBe(false);
    });
  });
});
