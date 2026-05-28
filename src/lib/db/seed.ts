// Production seed — client profiles, team members
// NEVER put test data here — see SO §11 Rule 12
//
// NOTE: User role updates (admin→co-ceo, employee→co-ceo, org_id→NULL)
// are NOT done here. Roles will be updated once confirmed with Brandon.
// When ready, uncomment the role update section below.

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
    // --- User role updates (confirmed — applied to local DB on April 25, 2026) ---
    await pool.query("UPDATE users SET role = 'co-ceo', organization_id = NULL WHERE id = $1", ["3a2338ab-1852-4159-9c51-9474ef409715"]); // Brandon Devier
    await pool.query("UPDATE users SET role = 'co-ceo', organization_id = NULL WHERE id = $1", ["d6f9a017-ff5b-4b23-81b9-6221d3f13313"]); // Zack Devier
    await pool.query("UPDATE users SET organization_id = NULL WHERE id = $1", ["c565cdb2-284b-4c39-bdcd-9d967cbfe901"]); // Cameron Cannon (director)
    console.log("[seed] user roles updated");

    // --- Client profiles for real client orgs ---
    const profiles = [
      {
        orgId: "a035b3cd-7f53-44e9-ab94-46ff68871cf9", // Armada Analytics
        industry: "Financial Services",
        revenue: 42000,
        contractStatus: "active",
        healthScore: "healthy",
        slaTarget: 95,
        contactName: "Sarah Mitchell",
        contactEmail: "admin@armadaanalytics.com",
      },
      {
        orgId: "8f4b5e20-2ea8-4293-8878-3d04fd1f0fe0", // OnPoint CFO
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
    // Brandon Devier, Zack Devier, and Cameron Cannon excluded per request
    const members: { userId: string; dept: string }[] = [];

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
