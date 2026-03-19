// Deletes ALL test data — respects FK order (children first)
// See: docs/security-and-operations.md §11 Rule 10
// NEVER uses TRUNCATE. NEVER deletes the test org row itself.

import { Pool } from "pg";
import { TEST_ORG_ID, TEST_EMAIL_DOMAIN } from "./test-constants";

export async function cleanupTestData(pool: Pool) {
  const org = TEST_ORG_ID;
  const emailPattern = `%${TEST_EMAIL_DOMAIN}`;

  // Child tables first (FK order)
  await pool.query("DELETE FROM ticket_activities WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM ticket_attachments WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM internal_notes WHERE ticket_id IN (SELECT id FROM tickets WHERE organization_id = $1)", [org]);
  await pool.query("DELETE FROM tickets WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM project_tasks WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM project_assignees WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM projects WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM documents WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM software_subscriptions WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM infrastructure_items WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM cloud_services WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM ai_messages WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM ai_conversations WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM notifications WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM connector_statuses WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM sync_logs WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM activity_log WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM management_notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await pool.query("DELETE FROM team_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await pool.query("DELETE FROM client_profiles WHERE organization_id = $1", [org]);
  await pool.query("DELETE FROM contact_form_submissions WHERE email LIKE $1", [emailPattern]);
  await pool.query("DELETE FROM report_snapshots WHERE data::text LIKE $1", [`%${org}%`]);

  // Test users last (other tables reference them)
  await pool.query("DELETE FROM users WHERE email LIKE $1", [emailPattern]);

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
