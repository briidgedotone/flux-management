# Flux Management Portal — Security & Operations

> This document extends the client portal's security rules (`Flux-client/docs/security-and-operations.md`).
> The management portal inherits ALL security rules from that document. This file documents only the **differences and additions** specific to the management portal.

---

## 1. Security Inheritance

The management portal follows the same security standards as the client portal:

- Parameterized SQL only — never string concatenation
- Zod validation on all API inputs — reject unexpected fields
- Generic error messages — never expose table names, stack traces, or SQL errors
- Security headers — HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy
- Secrets in Azure Key Vault (production) or `.env.local` (dev, gitignored)
- JWT in HTTP-only, Secure, SameSite=Lax cookie
- No `SELECT *` — always specify columns
- No `dangerouslySetInnerHTML`
- No SQL concatenation
- NEVER commit secrets, API keys, or credentials

---

## 2. Data Access Model — Key Difference

### Client Portal: Organization-Scoped
- Every user belongs to one organization
- `organization_id` is in the JWT
- All queries are scoped to that org via 3 layers: middleware, query params, RLS

### Management Portal: Cross-Organization
- Management users have `organization_id = NULL`
- No `organization_id` in the JWT
- Queries span all orgs or filter by org from URL parameter
- **No RLS enforcement** — access control is middleware-only

### Why This Is Acceptable

1. Management portal has **5 internal users**, not external clients
2. All management users are Flux employees with legitimate access to all client data
3. Role-based restrictions (`withRole`) prevent employees from seeing sensitive data (revenue, reports)
4. Network-level restrictions (IP whitelist, VPN) limit who can even reach the portal
5. Audit logging tracks every action for accountability

---

## 3. Authentication Security

### Separate App Registration
- Management portal uses its own Azure AD app registration (`flux-management-dev`)
- Separate from client portal's `flux-clientportal-dev`
- Only Flux employees can see/access the management app in Azure AD

### Cookie Isolation
- Cookie name: `flux-management-session` (different from client portal's `flux-session`)
- This prevents cookie conflicts if a user is logged into both portals simultaneously
- Same security attributes: HTTP-only, Secure, SameSite=Lax

### Role Verification
- On every request, `withManagementAuth` verifies:
  1. Valid JWT in cookie
  2. User exists in database
  3. User role is `co-ceo`, `director`, or `employee`
- If user role is `client`, access is **denied** — client users cannot use the management portal

---

## 4. Role-Based Access Control

### Enforcement Pattern

```typescript
// Public routes (login/callback only):
export async function POST(request: NextRequest) { ... }

// Any management user:
export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => { ... });
}

// Restricted to co-ceo/director:
export async function PUT(request: NextRequest) {
  return withRole(request, ['co-ceo', 'director'], async (ctx) => { ... });
}
```

### Sensitive Endpoints (co-ceo/director only)

- `PUT /api/clients/:id` — Edit client profiles (revenue, contracts)
- ~~`DELETE /api/projects/:id/tasks/:taskId`~~ — Employees can delete own tasks; co-ceo/director can delete any
- `PUT /api/team/:id` — Edit team member profiles
- All `/api/reports/*` endpoints — View financial and performance reports
- `GET /api/contact-submissions` — View contact form submissions
- `PUT /api/contact-submissions/:id` — Update submission status

### Employee Restrictions

Employees can:
- View dashboard (limited — no revenue)
- View client list and detail (read-only)
- View all tickets (read-only)
- Add internal notes to tickets
- View projects
- Create and update their own tasks
- View their own team stats
- Use AI assistant (own context only)
- Edit their own profile

Employees **cannot**:
- Edit client profiles
- Delete other people's tasks (can delete own)
- Edit other team members
- View reports
- View contact form submissions
- Access settings beyond own profile

---

## 5. Audit Logging

### What Gets Logged

Every mutation (create, update, delete) writes to `activity_log`:

| Field | Description |
|-------|-------------|
| `user_id` | Who performed the action |
| `action` | What they did (created, updated, deleted) |
| `entity_type` | What kind of entity (ticket, project, client, task, note, etc.) |
| `entity_id` | Which specific entity |
| `organization_id` | Which client's data was affected |
| `description` | Human-readable description |
| `metadata` | JSONB with before/after values (for updates) |
| `created_at` | When it happened |

### What Does NOT Get Logged

- Read-only operations (viewing lists, details) — too noisy
- Auth events (login, logout) — handled by Azure AD logs
- AI conversations — private to each user

### Retention

- Activity logs retained for 12 months minimum
- Older logs can be archived to cold storage

---

## 6. Rate Limiting

| Route Category | Limit | Key |
|----------------|-------|-----|
| Default | 100 req/min | User ID |
| Auth | 10 req/min | IP address |
| AI Chat | 20 req/min | User ID |
| Reports | 30 req/min | User ID |
| Contact webhook | 10 req/min | API key |

### Implementation
- In-memory rate limiter (same as client portal)
- Keyed by user ID for authenticated routes, IP for public routes
- Returns 429 Too Many Requests when exceeded

---

## 7. Network Security (Recommended)

Since this is an internal tool for 5 users:

### Azure App Service Level
- IP whitelist: office IP addresses + VPN exit points
- Optional: Azure Private Endpoint for database access

### Azure AD Level
- Conditional Access policy requiring MFA for management app
- Block access from unrecognized devices/locations

### DNS Level
- Use a non-obvious subdomain (e.g., `mgmt.fluxtech.com` not `admin.fluxtech.com`)
- No public links to the management portal

---

## 8. Secrets Management

### Shared Secrets (Same as Client Portal)
- `DATABASE_URL` — Same database connection string
- `ATERA_API_KEY` — Same Atera API key
- `ANTHROPIC_API_KEY` — Same Claude API key
- `AZURE_KEY_VAULT_URL` — Same Key Vault

### Management-Specific Secrets
- `AZURE_AD_CLIENT_ID` — Management app registration client ID
- `AZURE_AD_CLIENT_SECRET` — Management app registration client secret
- `JWT_SECRET` — Separate JWT signing secret (not shared with client portal)
- `CONTACT_WEBHOOK_SECRET` — Shared secret for flux-app webhook

### Rules
- All secrets in Azure Key Vault (production) or `.env.local` (development)
- `.env.local` is gitignored — never committed
- Never log secrets, tokens, or full email addresses
- Never hardcode secrets in code, comments, or tests

---

## 9. API Security

### Input Validation
- All inputs validated with Zod schemas before processing
- Reject unexpected fields (strict schemas)
- Validate UUIDs, enums, date formats, numeric ranges

### Error Responses
```typescript
// GOOD — generic message
return Errors.NOT_FOUND("Resource not found");

// BAD — exposes internals
return NextResponse.json({ error: "Row not found in client_profiles table for org_id=..." });
```

### SQL Safety
```typescript
// GOOD — parameterized
await pool.query('SELECT id, name FROM tickets WHERE status = $1', [status]);

// BAD — concatenation
await pool.query(`SELECT * FROM tickets WHERE status = '${status}'`);
```

### Webhook Security
- Contact form webhook authenticated via `X-API-Secret` header
- Secret compared using constant-time comparison to prevent timing attacks
- Request body validated with Zod schema

---

## 10. Code Review Checklist

Before merging any PR:

- [ ] All new API routes have `withManagementAuth` or `withRole` middleware
- [ ] All new database queries use parameterized SQL
- [ ] All mutation endpoints write to `activity_log`
- [ ] All inputs validated with Zod schemas
- [ ] No `SELECT *` — columns explicitly listed
- [ ] No hardcoded secrets or credentials
- [ ] No `dangerouslySetInnerHTML`
- [ ] Generic error messages only (no table names, SQL errors, stack traces)
- [ ] Rate limiting applied to new routes
- [ ] Role restrictions correct (employee vs co-ceo/director)
- [ ] All cross-org queries include `WHERE o.is_active = true`
- [ ] `git diff` reviewed — no secrets leaked
- [ ] Build passes without errors

---

## 11. Test Data Isolation — Mandatory Rules

> This is a CRITICAL section. The database contains real client data from a production IT firm.
> Violating these rules can corrupt real client dashboards, pollute reports, and break trust.

### The Test Organization

A single test organization exists in the `organizations` table:

| Field | Value |
|-------|-------|
| id | `00000000-0000-0000-0000-000000000099` |
| name | `Flux QA Internal` |
| slug | `flux-qa-internal` |
| is_active | `false` |

**This is the ONLY organization that tests may write to.** Real organizations (Armada Capital, OnPoint Consulting, Flux Technologies) must NEVER be referenced in test code.

### Test Users

| ID | Email | Role | org_id |
|----|-------|------|--------|
| `00000000-0000-0000-0000-000000000001` | `test-ceo@test.flux.internal` | co-ceo | NULL |
| `00000000-0000-0000-0000-000000000002` | `test-director@test.flux.internal` | director | NULL |
| `00000000-0000-0000-0000-000000000003` | `test-employee@test.flux.internal` | employee | NULL |
| `00000000-0000-0000-0000-000000000004` | `test-client@test.flux.internal` | client | TEST_ORG |

**These are the ONLY users that tests may use.** Real user IDs and emails must NEVER appear in test code.

### The Rules

#### Rule 1: NEVER Write to Real Data
- Tests must NEVER INSERT, UPDATE, or DELETE rows belonging to real organizations.
- Tests must NEVER reference real organization IDs, real user IDs, or real email addresses.
- If a test needs to verify cross-org behavior, it reads real data but writes ONLY to the test org.

#### Rule 2: ALL Test Writes Must Be Scoped
- Every INSERT in test code must use `organization_id = TEST_ORG_ID` for org-scoped tables.
- Every INSERT for user-scoped tables must use test user IDs (`TEST_CEO_ID`, etc.).
- Every INSERT for email fields must use `@test.flux.internal` domain.
- No exceptions. No "temporary" writes to real orgs.

#### Rule 3: Test Data Must Be Traceable
- All test data must be identifiable by exactly two markers:
  - `organization_id = '00000000-0000-0000-0000-000000000099'`
  - `email LIKE '%@test.flux.internal'`
- The cleanup function uses these markers to find and delete ALL test data.
- If test data cannot be found by these markers, the cleanup will miss it — leaving orphaned test rows in the real database.

#### Rule 4: Cleanup Runs Automatically
- Global setup: cleanup leftover test data → seed fresh test data.
- Global teardown: cleanup all test data.
- This means the database is identical before and after every test run.
- If tests crash midway, the next run's setup cleanup handles it.

#### Rule 5: Seed Data Is Idempotent
- All seed INSERT statements use `ON CONFLICT DO NOTHING`.
- Running the seed multiple times produces the same result.
- The test org row is permanent — cleanup deletes test DATA, never the test org itself.

#### Rule 6: Test Constants Are Sacred
- Test UUIDs (`00000000-...-000000000099`, `...-000000000001` through `...-000000000004`) are reserved for testing.
- They must NEVER be used for real data.
- They must NEVER be changed once established.
- All test files import from `src/__tests__/test-constants.ts` — never hardcode UUIDs.

#### Rule 7: Cross-Org Queries Must Filter Active
- Every production query that aggregates across organizations must include `WHERE o.is_active = true`.
- This excludes the test org (`is_active = false`) from production results.
- This also correctly excludes future churned/inactive clients.
- Single-resource lookups by ID do not need this filter.
- Applies to: dashboard, client list, reports, ticket stats, project stats, AI context builder.

#### Rule 8: NEVER Delete Real Rows
- The cleanup function must NEVER contain a `DELETE` without a `WHERE` clause scoping to the test org or test users.
- The cleanup function must NEVER use `TRUNCATE` — it would wipe all rows including real data.
- Every `DELETE` in cleanup must reference either `TEST_ORG_ID` or `TEST_EMAIL_DOMAIN`.

#### Rule 9: NEVER Use Production Credentials in Tests
- Tests must use test user JWTs created from test user constants.
- Tests must NEVER use real Azure AD tokens.
- Tests must NEVER call real external APIs (Atera, Graph, Claude) — mock them.
- Tests that verify auth flows must use test users, not real employees.

#### Rule 10: Foreign Key Order in Cleanup
- Cleanup must delete in child-first order to respect foreign key constraints:
  1. `internal_notes` (FK → tickets)
  2. `ticket_activities`, `ticket_attachments` (FK → tickets)
  3. `tickets`
  4. `project_tasks`, `project_assignees` (FK → projects)
  5. `projects`
  6. `documents`, `software_subscriptions`, `infrastructure_items`, `cloud_services`
  7. `ai_messages` (FK → ai_conversations)
  8. `ai_conversations` (FK → users)
  9. `management_notifications`, `notifications` (FK → users)
  10. `activity_log`
  11. `team_members` (FK → users)
  12. `client_profiles` (FK → organizations)
  13. `contact_form_submissions`
  14. `report_snapshots`
  15. `sync_logs`
  16. `connector_statuses`
  17. `users` (test users only, by email domain)
  18. NEVER delete the test organization row

#### Rule 11: Guard Against Accidental Production Writes
- Test infrastructure must include a guard that verifies the target org is the test org before any write operation:
```typescript
export function assertTestOrg(organizationId: string) {
  if (organizationId !== TEST_ORG_ID) {
    throw new Error(
      `FATAL: Test attempted to write to non-test org: ${organizationId}. ` +
      `Only TEST_ORG_ID (${TEST_ORG_ID}) is allowed.`
    );
  }
}
```
- This guard must be called in test helpers that perform INSERTs.

#### Rule 12: No Test Data in Seed Scripts for Production
- The production seed script (`src/lib/db/seed.ts`) must NEVER contain test org data.
- Test org and test users are created ONLY by the test seed script (`src/__tests__/seed-test-data.ts`).
- These are separate files with separate purposes. Never merge them.

#### Rule 13: Review Test Cleanup in Every PR
- Every PR that adds or modifies tests must verify:
  - [ ] New test data is scoped to TEST_ORG_ID or test user IDs
  - [ ] New tables added to cleanup function in correct FK order
  - [ ] No real org IDs or emails in test code
  - [ ] `assertTestOrg()` guard used for write operations
  - [ ] Test passes with clean database (no leftover state dependency)

### Recovery: If Test Data Leaks

If test data is accidentally left in the database (cleanup failed, manual testing forgot to clean up):

```sql
-- Emergency cleanup query — run manually
-- Finds all rows belonging to test org
SELECT 'tickets' as tbl, COUNT(*) FROM tickets WHERE organization_id = '00000000-0000-0000-0000-000000000099'
UNION ALL
SELECT 'projects', COUNT(*) FROM projects WHERE organization_id = '00000000-0000-0000-0000-000000000099'
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE organization_id = '00000000-0000-0000-0000-000000000099'
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE email LIKE '%@test.flux.internal';

-- If rows found, run the cleanup script:
-- npm run test:cleanup
```

The test org itself (`is_active = false`) can safely remain — it's invisible to production queries.
