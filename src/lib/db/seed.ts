// Production seed — management users, client profiles, team members
// NEVER put test data here — see SO §11 Rule 12
// Uses DATABASE_ADMIN_URL for privilege to update user roles

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[seed] DATABASE_ADMIN_URL or DATABASE_URL is not set");
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // --- Update management user roles (from client portal roles to management roles) ---
    // Brandon Devier: admin → co-ceo, org_id → NULL (cross-org)
    await pool.query(
      "UPDATE users SET role = 'co-ceo', organization_id = NULL WHERE id = $1",
      ["b0000000-0000-0000-0000-000000000001"]
    );
    console.log("[seed] Brandon Devier → co-ceo");

    // Zack Devier: employee → co-ceo, org_id → NULL (cross-org)
    await pool.query(
      "UPDATE users SET role = 'co-ceo', organization_id = NULL WHERE id = $1",
      ["b0000000-0000-0000-0000-000000000003"]
    );
    console.log("[seed] Zack Devier → co-ceo");

    // Cameron Cannon: director stays director, org_id → NULL (cross-org)
    await pool.query(
      "UPDATE users SET organization_id = NULL WHERE id = $1",
      ["b0000000-0000-0000-0000-000000000002"]
    );
    console.log("[seed] Cameron Cannon → director (cross-org)");

    // --- Client profiles for real client orgs ---
    const profiles = [
      {
        orgId: "a0000000-0000-0000-0000-000000000002", // Armada Analytics
        industry: "Financial Services",
        revenue: 42000,
        contractStatus: "active",
        healthScore: "healthy",
        slaTarget: 95,
        contactName: "Sarah Mitchell",
        contactEmail: "admin@armadaanalytics.com",
      },
      {
        orgId: "a0000000-0000-0000-0000-000000000003", // OnPoint CFO
        industry: "Professional Services",
        revenue: 28000,
        contractStatus: "active",
        healthScore: "healthy",
        slaTarget: 95,
        contactName: "Mike Reynolds",
        contactEmail: "admin@onpointcfo.com",
      },
    ];

    for (const p of profiles) {
      await pool.query(
        `INSERT INTO client_profiles (organization_id, industry, monthly_revenue, contract_status, health_score, sla_target, primary_contact_name, primary_contact_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (organization_id) DO NOTHING`,
        [p.orgId, p.industry, p.revenue, p.contractStatus, p.healthScore, p.slaTarget, p.contactName, p.contactEmail]
      );
    }
    console.log("[seed] client profiles created for Armada + OnPoint");

    // --- Team members for management users ---
    const members = [
      { userId: "b0000000-0000-0000-0000-000000000001", dept: "Leadership" },  // Brandon Devier
      { userId: "b0000000-0000-0000-0000-000000000003", dept: "Leadership" },  // Zack Devier
      { userId: "b0000000-0000-0000-0000-000000000002", dept: "Services" },    // Cameron Cannon
    ];

    for (const m of members) {
      await pool.query(
        `INSERT INTO team_members (user_id, department, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT (user_id) DO NOTHING`,
        [m.userId, m.dept]
      );
    }
    console.log("[seed] team members created");

    console.log("[seed] done");
  } finally {
    await pool.end();
  }
}

// Run directly: npx tsx src/lib/db/seed.ts
run().catch((err) => { console.error(err); process.exit(1); });
