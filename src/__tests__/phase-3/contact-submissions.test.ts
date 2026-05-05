import { describe, it, expect } from "vitest";
import { listSubmissions, updateSubmissionStatus, createSubmission } from "@/lib/db/queries/contact-submissions";
import { TEST_CEO_ID } from "../test-constants";
import { assertTestUser } from "../guards";

describe("Contact Submission Queries", () => {
  it("lists submissions from seed data", async () => {
    const result = await listSubmissions();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("name");
    expect(result.data[0]).toHaveProperty("email");
    expect(result.data[0]).toHaveProperty("status");
  });

  it("supports status filter", async () => {
    const result = await listSubmissions({ status: "new" });
    for (const s of result.data) {
      expect(s.status).toBe("new");
    }
  });

  it("creates submission with test email", async () => {
    const sub = await createSubmission({
      name: "Phase 3 Test Contact",
      email: "phase3@test.flux.internal",
      company: "Test Corp",
      message: "Test message from phase-3",
    });
    expect(sub).not.toBeNull();
    expect(sub.name).toBe("Phase 3 Test Contact");
    expect(sub.status).toBe("new");
  });

  it("updates submission status", async () => {
    assertTestUser(TEST_CEO_ID);
    const list = await listSubmissions({ status: "new" });
    if (list.data.length > 0) {
      const updated = await updateSubmissionStatus(list.data[0].id, "reviewed", TEST_CEO_ID);
      expect(updated).not.toBeNull();
      expect(updated.status).toBe("reviewed");
    }
  });

  it("supports pagination", async () => {
    const result = await listSubmissions({ page: 1, limit: 1 });
    expect(result.limit).toBe(1);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });
});
