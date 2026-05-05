import { describe, it, expect } from "vitest";
import { createConversation, listConversations, getConversation, addMessage, deleteConversation } from "@/lib/db/queries/ai";
import { TEST_CEO_ID } from "../test-constants";
import { assertTestUser } from "../guards";

describe("AI Queries", () => {
  let convoId: string | null = null;

  it("creates conversation for test user", async () => {
    assertTestUser(TEST_CEO_ID);
    const convo = await createConversation(TEST_CEO_ID, "Test conversation");
    expect(convo).not.toBeNull();
    expect(convo.title).toBe("Test conversation");
    convoId = convo.id;
  });

  it("lists conversations for user", async () => {
    const convos = await listConversations(TEST_CEO_ID);
    expect(convos.length).toBeGreaterThan(0);
    expect(convos[0]).toHaveProperty("id");
    expect(convos[0]).toHaveProperty("title");
  });

  it("adds messages to conversation", async () => {
    if (!convoId) return;
    const userMsg = await addMessage(convoId, "user", "Hello AI");
    expect(userMsg).not.toBeNull();
    expect(userMsg.role).toBe("user");

    const assistantMsg = await addMessage(convoId, "assistant", "Hello! How can I help?", 50);
    expect(assistantMsg).not.toBeNull();
    expect(assistantMsg.role).toBe("assistant");
  });

  it("gets conversation with messages", async () => {
    if (!convoId) return;
    const convo = await getConversation(convoId);
    expect(convo).not.toBeNull();
    expect(convo!.messages.length).toBe(2);
    expect(convo!.messages[0].role).toBe("user");
    expect(convo!.messages[1].role).toBe("assistant");
  });

  it("deletes conversation", async () => {
    if (!convoId) return;
    const deleted = await deleteConversation(convoId);
    expect(deleted).toBe(true);

    const result = await getConversation(convoId);
    expect(result).toBeNull();
  });

  it("returns null for non-existent conversation", async () => {
    const result = await getConversation("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });
});
