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

  // --- Test Tickets (5) ---
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

  // --- Management Tables Seed Data ---

  // Client profile for test org
  await pool.query(
    `INSERT INTO client_profiles (organization_id, industry, monthly_revenue, contract_status, health_score, sla_target, primary_contact_name, primary_contact_email)
     VALUES ($1, 'Technology', 5000.00, 'active', 'healthy', 95, 'Test Client User', 'test-client@test.flux.internal')
     ON CONFLICT (organization_id) DO NOTHING`,
    [TEST_ORG_ID]
  );

  // Team members for test management users
  for (const userId of [TEST_CEO_ID, TEST_DIRECTOR_ID, TEST_EMPLOYEE_ID]) {
    await pool.query(
      `INSERT INTO team_members (user_id, department, status)
       VALUES ($1, 'Test Department', 'active')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  }

  // Internal notes on first test ticket
  const ticketResult = await pool.query(
    `SELECT id FROM tickets WHERE organization_id = $1 LIMIT 1`,
    [TEST_ORG_ID]
  );
  if (ticketResult.rows.length > 0) {
    await pool.query(
      `INSERT INTO internal_notes (ticket_id, author_id, content)
       VALUES ($1, $2, 'Test internal note from CEO')
       ON CONFLICT DO NOTHING`,
      [ticketResult.rows[0].id, TEST_CEO_ID]
    );
  }

  // Management notifications for test users
  for (const [userId, type] of [
    [TEST_CEO_ID, "ticket_escalation"],
    [TEST_CEO_ID, "contact_form"],
    [TEST_DIRECTOR_ID, "health_alert"],
    [TEST_EMPLOYEE_ID, "task_assignment"],
    [TEST_EMPLOYEE_ID, "system"],
  ] as const) {
    await pool.query(
      `INSERT INTO management_notifications (user_id, type, title, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, type, `Test: ${type} notification`, `Test notification of type ${type}`]
    );
  }

  // Contact form submissions
  for (let i = 0; i < 3; i++) {
    await pool.query(
      `INSERT INTO contact_form_submissions (name, email, company, message, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `Test Contact ${i + 1}`,
        `contact-${i + 1}@test.flux.internal`,
        `Test Company ${i + 1}`,
        `Test message ${i + 1}`,
        ["new", "reviewed", "responded"][i],
      ]
    );
  }

  console.log("[seed-test-data] test org, users, tickets, projects, and management data seeded");
}

// Run directly: npx tsx src/__tests__/seed-test-data.ts
if (require.main === module) {
  require("dotenv").config({ path: ".env.local" });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  seedTestData(pool)
    .then(() => pool.end())
    .catch((err) => { console.error(err); process.exit(1); });
}
