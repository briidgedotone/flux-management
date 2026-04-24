import { describe, it, expect } from "vitest";
import { listNotifications, getUnreadCount, markAsRead, createNotification } from "@/lib/db/queries/notifications";
import { TEST_CEO_ID, TEST_EMPLOYEE_ID } from "../test-constants";
import { assertTestUser } from "../guards";

describe("Notification Queries", () => {
  it("lists notifications for test user", async () => {
    const result = await listNotifications(TEST_CEO_ID);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("type");
    expect(result.data[0]).toHaveProperty("title");
    expect(result.data[0]).toHaveProperty("isRead");
  });

  it("supports type filter", async () => {
    const result = await listNotifications(TEST_CEO_ID, { type: "ticket_escalation" });
    for (const n of result.data) {
      expect(n.type).toBe("ticket_escalation");
    }
  });

  it("gets unread count", async () => {
    const count = await getUnreadCount(TEST_CEO_ID);
    expect(typeof count).toBe("number");
  });

  it("creates notification for test user", async () => {
    assertTestUser(TEST_EMPLOYEE_ID);
    const notif = await createNotification(TEST_EMPLOYEE_ID, {
      type: "system",
      title: "Test notification from phase-3",
      description: "Test description",
    });
    expect(notif).not.toBeNull();
    expect(notif.title).toBe("Test notification from phase-3");
    expect(notif.is_read).toBe(false);
  });

  it("marks single notification as read", async () => {
    const list = await listNotifications(TEST_CEO_ID);
    const unread = list.data.find((n) => !n.isRead);
    if (unread) {
      await markAsRead(TEST_CEO_ID, unread.id);
      const updated = await listNotifications(TEST_CEO_ID);
      const found = updated.data.find((n) => n.id === unread.id);
      expect(found?.isRead).toBe(true);
    }
  });

  it("marks all as read", async () => {
    await markAsRead(TEST_EMPLOYEE_ID);
    const count = await getUnreadCount(TEST_EMPLOYEE_ID);
    expect(count).toBe(0);
  });
});
