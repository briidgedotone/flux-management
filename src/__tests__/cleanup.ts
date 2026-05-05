// Deletes ALL test data — respects FK order (children first)
// See: docs/security-and-operations.md §11 Rule 10
// NEVER uses TRUNCATE. NEVER deletes the test org row itself.

import { Pool } from "pg";
import { TEST_ORG_ID, TEST_EMAIL_DOMAIN } from "./test-constants";

async function safeDelete(pool: Pool, sql: string, params: unknown[]) {
  try {
    await pool.query(sql, params);
  } catch (err: unknown) {
    // Skip if table doesn't exist yet (management tables added in Phase 1)
    if ((err as { code?: string }).code === "42P01") return;
    throw err;
  }
}

export async function cleanupTestData(pool: Pool) {
  const org = TEST_ORG_ID;
  const emailPattern = `%${TEST_EMAIL_DOMAIN}`;

  // Child tables first (FK order)
  await safeDelete(pool, "DELETE FROM ticket_activities WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM ticket_attachments WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM internal_notes WHERE ticket_id IN (SELECT id FROM tickets WHERE organization_id = $1)", [org]);
  await safeDelete(pool, "DELETE FROM tickets WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM project_tasks WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM project_assignees WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM projects WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM documents WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM software_subscriptions WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM infrastructure_items WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM cloud_services WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM ai_messages WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM ai_conversations WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM notifications WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM connector_statuses WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM sync_logs WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM activity_log WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM management_notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await safeDelete(pool, "DELETE FROM team_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await safeDelete(pool, "DELETE FROM client_profiles WHERE organization_id = $1", [org]);
  await safeDelete(pool, "DELETE FROM contact_form_submissions WHERE email LIKE $1", [emailPattern]);
  await safeDelete(pool, "DELETE FROM report_snapshots WHERE data::text LIKE $1", [`%${org}%`]);

  // Test users last (other tables reference them)
  await safeDelete(pool, "DELETE FROM users WHERE email LIKE $1", [emailPattern]);

  // DO NOT delete the test org row — it's a permanent fixture
  console.log("[cleanup] all test data removed");
}

// Run directly: npx tsx src/__tests__/cleanup.ts
if (require.main === module) {
  require("dotenv").config({ path: ".env.local" });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  cleanupTestData(pool)
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}
