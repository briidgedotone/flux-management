// AI conversation and message query module
// Management portal: conversations are user-scoped (no org filter needed)
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

/** Create a new conversation for a user. */
export async function createConversation(userId: string, title?: string) {
  // Management users have organization_id = NULL (cross-org).
  // The ai_conversations table requires organization_id (shared schema with client portal).
  // Use the user's org if they have one, otherwise use the first active org as a system context.
  const result = await query(
    `INSERT INTO ai_conversations (user_id, organization_id, title)
     VALUES (
       $1,
       COALESCE(
         (SELECT organization_id FROM users WHERE id = $1),
         (SELECT id FROM organizations WHERE is_active = true ORDER BY name LIMIT 1)
       ),
       $2
     )
     RETURNING id, user_id, title, created_at`,
    [userId, title ?? "New conversation"],
  );
  return result.rows[0] ?? null;
}

/** List conversations for a user, most recent first. */
export async function listConversations(userId: string) {
  const result = await query(
    `SELECT id, title, created_at, updated_at
     FROM ai_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 50`,
    [userId],
  );

  return result.rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at?.toISOString?.() ?? "",
    updatedAt: r.updated_at?.toISOString?.() ?? "",
  }));
}

/** Get a conversation with all its messages. */
export async function getConversation(conversationId: string) {
  const convoResult = await query(
    `SELECT id, user_id, title, created_at, updated_at
     FROM ai_conversations WHERE id = $1`,
    [conversationId],
  );

  if (!convoResult.rows[0]) return null;
  const c = convoResult.rows[0];

  const messagesResult = await query(
    `SELECT id, role, content, tokens_used, created_at
     FROM ai_messages WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId],
  );

  return {
    id: c.id,
    userId: c.user_id,
    title: c.title,
    createdAt: c.created_at?.toISOString?.() ?? "",
    updatedAt: c.updated_at?.toISOString?.() ?? "",
    messages: messagesResult.rows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      tokensUsed: m.tokens_used,
      createdAt: m.created_at?.toISOString?.() ?? "",
    })),
  };
}

/** Add a message to a conversation. */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  tokensUsed?: number,
) {
  // Get org_id from conversation for the shared schema constraint
  const convo = await query(
    `SELECT organization_id FROM ai_conversations WHERE id = $1`,
    [conversationId],
  );
  const orgId = convo.rows[0]?.organization_id;
  if (!orgId) return null;

  const result = await query(
    `INSERT INTO ai_messages (conversation_id, organization_id, role, content, tokens_used)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, role, content, tokens_used, created_at`,
    [conversationId, orgId, role, content, tokensUsed ?? null],
  );

  // Update conversation timestamp
  await query(
    `UPDATE ai_conversations SET updated_at = now() WHERE id = $1`,
    [conversationId],
  );

  return result.rows[0] ?? null;
}

/** Delete a conversation and all its messages (CASCADE). */
export async function deleteConversation(conversationId: string) {
  const result = await query(
    `DELETE FROM ai_conversations WHERE id = $1 RETURNING id`,
    [conversationId],
  );
  return (result.rowCount ?? 0) > 0;
}
