// Creates test org + test users + test data — all idempotent (ON CONFLICT DO NOTHING)
// See: docs/backend-plan.md §10 (Test Strategy)
// NEVER put real data here. NEVER import this from production code.

import { Pool } from "pg";
import {
  TEST_ORG_ID, TEST_ORG_NAME, TEST_ORG_SLUG,
  TEST_CEO_ID, TEST_DIRECTOR_ID, TEST_EMPLOYEE_ID, TEST_CLIENT_USER_ID,
} from "./test-constants";

export async function seedTestData(pool: Pool) {
  // --- Test Organization (is_active = false — invisible to production queries) ---
  await pool.query(
    `INSERT INTO organizations (id, name, slug, is_active)
     VALUES ($1, $2, $3, false)
     ON CONFLICT (id) DO NOTHING`,
    [TEST_ORG_ID, TEST_ORG_NAME, TEST_ORG_SLUG]
  );

  // --- Test Users ---
  const users = [
    [TEST_CEO_ID, "test-ceo@test.flux.internal", "Test CEO", "co-ceo", null],
    [TEST_DIRECTOR_ID, "test-director@test.flux.internal", "Test Director", "director", null],
    [TEST_EMPLOYEE_ID, "test-employee@test.flux.internal", "Test Employee", "employee", null],
    [TEST_CLIENT_USER_ID, "test-client@test.flux.internal", "Test Client User", "client", TEST_ORG_ID],
  ];

  for (const [id, email, name, role, orgId] of users) {
    await pool.query(
      `INSERT INTO users (id, email, name, role, organization_id, initials, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (id) DO NOTHING`,
      [id, email, name, role, orgId, (name as string).split(" ").map(w => w[0]).join("")]
    );
  }

  // --- Test Tickets (5 — enough to test queries, not too many) ---
  const statuses = ["Open", "Open", "Pending", "Closed", "Closed"];
  const priorities = ["Critical", "High", "Medium", "Low", "Medium"];
  for (let i = 0; i < 5; i++) {
    await pool.query(
      `INSERT INTO tickets (id, organization_id, atera_ticket_id, ticket_number, subject, description, status, priority, assigned_to_name, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, now() - interval '${5 - i} days', now() - interval '${5 - i} hours')
       ON CONFLICT (organization_id, atera_ticket_id) DO NOTHING`,
      [
        TEST_ORG_ID,
        `test-atera-${i + 1}`,
        `T-TEST-${i + 1}`,
        `Test Ticket ${i + 1}: ${["VPN issue", "Printer offline", "Email sync", "Password reset", "Software install"][i]}`,
        `Test description for ticket ${i + 1}`,
        statuses[i],
        priorities[i],
        "Test Employee",
      ]
    );
  }

  // --- Test Projects (2) ---
  for (let i = 0; i < 2; i++) {
    await pool.query(
      `INSERT INTO projects (id, organization_id, planner_plan_id, project_number, name, description, category, status, progress, tasks_completed, total_tasks, start_date, due_date, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now() - interval '30 days', now() + interval '30 days', now(), now())
       ON CONFLICT (organization_id, planner_plan_id) DO NOTHING`,
      [
        TEST_ORG_ID,
        `test-plan-${i + 1}`,
        `P-TEST-${i + 1}`,
        ["Test: Network Upgrade", "Test: M365 Migration"][i],
        `Test project ${i + 1} description`,
        ["Infrastructure", "Cloud"][i],
        ["On Track", "At Risk"][i],
        [60, 30][i],
        [3, 1][i],
        [5, 4][i],
      ]
    );
  }

  console.log("[seed-test-data] test org, users, tickets, and projects seeded");
}

// Run directly: npx tsx src/__tests__/seed-test-data.ts
if (require.main === module) {
  require("dotenv").config({ path: ".env.local" });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  seedTestData(pool)
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}
