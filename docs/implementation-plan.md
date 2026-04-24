# Flux Management Portal — Implementation Plan

> **This is the single source of truth for implementation progress.**
> After completing each step, mark it as `✅ DONE` in this file.
> Before starting work, check which step is next. Never skip steps.
>
> **Reference docs:**
> - `backend-plan.md` (abbreviated as **BP**) — Architecture, schema, API routes, integrations
> - `security-and-operations.md` (abbreviated as **SO**) — Security rules, access control, audit logging
> - `external-api-safety.md` (abbreviated as **EA**) — External API interaction rules
> - `testing-plan.md` (abbreviated as **TP**) — Test strategy, test org, verification checklists

---

## Rules — Read Before Every Session

> **These rules apply to EVERY step in this plan. Violating any of them can corrupt real client data, break security, or cause production incidents. Read this section at the start of every working session.**

### Real Data Protection (The #1 Priority)

The database contains real production data from Flux Technologies' clients (1,611+ tickets, real documents, real user accounts). This is a professional IT firm — their clients see this data.

| # | Rule |
|---|------|
| R1 | **NEVER INSERT, UPDATE, or DELETE rows belonging to real organizations** — only the test org (`TEST_ORG_ID`) is writable in tests |
| R2 | **NEVER reference real org IDs, user IDs, or emails in test code** — only use `TEST_*` constants from `test-constants.ts` |
| R3 | **ALL test writes scoped to `TEST_ORG_ID`** (`00000000-0000-0000-0000-000000000099`) — the only safe write target |
| R4 | **ALL test users use `@test.flux.internal` email domain** — makes test data instantly identifiable and cleanable |
| R5 | **Use `assertTestOrg()` guard before every write in tests** — programmatic safety that throws if wrong org |
| R6 | **NEVER use `TRUNCATE`** — always `DELETE WHERE organization_id = TEST_ORG_ID` scoped to test data |
| R7 | **Test org has `is_active = false`** — production queries filter it out with `WHERE o.is_active = true` |
| R8 | **Production seed script must NEVER contain test data** — test data belongs only in `src/__tests__/seed-test-data.ts`, never in `src/lib/db/seed.ts` |
| R9 | **External APIs (Planner, Claude, Outlook) are MOCKED in tests** — never create real tasks, send real emails, or burn API credits |
| R10 | **Cleanup runs before AND after every test suite** — catches leftover data from crashes or interrupted runs |

### The `is_active` Filter (Applies to Every Cross-Org Query)

| # | Rule |
|---|------|
| R11 | **Every query that aggregates across organizations MUST include `WHERE o.is_active = true`** — this is the mechanism that keeps test data invisible to real users |
| R12 | **Applies to:** dashboard KPIs, client list, ticket stats, project stats, all 4 report types, AI context builder |
| R13 | **Does NOT apply to:** single-resource lookups by ID, user-scoped queries, webhook endpoints |
| R14 | **If you forget this filter on even one query, test data appears in real dashboards** |

### Security (Every Line of Code)

| # | Rule |
|---|------|
| R15 | **Parameterized SQL only** — `$1, $2` params. NEVER string concatenation. SQL injection is the #1 web vulnerability. |
| R16 | **Validate ALL inputs with Zod schemas** — reject unexpected fields before they reach the database |
| R17 | **No `SELECT *`** — always specify columns. Future sensitive columns would be leaked silently. |
| R18 | **Generic error messages only** — never expose table names, SQL errors, stack traces, or internal details |
| R19 | **No `dangerouslySetInnerHTML`** — XSS vulnerability |
| R20 | **Secrets in `.env.local` (dev) or Key Vault (prod) only** — never in code, comments, tests, or git history |
| R21 | **NEVER log secrets, tokens, or full email addresses** — log aggregators are not secure |
| R22 | **Review `git diff` before every commit** — last line of defense for leaked secrets |

### Authentication & Authorization

| # | Rule |
|---|------|
| R23 | **Every API route MUST have `withManagementAuth`** — no unauthenticated access, no exceptions |
| R24 | **Sensitive routes MUST have `withRole(['co-ceo', 'director'])`** — employees cannot see revenue, reports, or edit clients/team |
| R25 | **Client role is BLOCKED entirely** — `withManagementAuth` rejects users with role `client` |
| R26 | **Cookie name: `flux-management-session`** — not `flux-session`. Prevents collision with client portal. |
| R27 | **JWT has NO `organizationId`** — management users are cross-org. Org comes from URL params when needed. |
| R28 | **Never trust org/user IDs from request body** — IDs for filtering come from URL params, IDs for auth come from JWT |

### Audit Logging

| # | Rule |
|---|------|
| R29 | **Every mutation (create, update, delete) MUST write to `activity_log`** — who did what, when, to which client's data |
| R30 | **Read-only operations do NOT log** — too noisy, no audit value |
| R31 | **Log entries must include:** `user_id`, `action`, `entity_type`, `entity_id`, `organization_id`, `description` |

### External APIs

| # | Rule |
|---|------|
| R32 | **Management portal never calls Atera or SharePoint directly** — data comes from sync jobs via shared DB tables |
| R33 | **Planner writes are background and non-blocking** — DB write succeeds even if Planner API fails. Log error, don't throw. |
| R34 | **Never modify Planner plans or buckets** — only individual tasks (create, update, delete) |
| R35 | **Email failures are non-blocking** — log error, don't throw. Notifications are best-effort. |
| R36 | **Claude context must NOT contain API keys, secrets, or test org data** |
| R37 | **AI responses include "Verify critical information" disclaimer** |

### Database

| # | Rule |
|---|------|
| R38 | **Shared database with client portal** — never create a separate DB for management |
| R39 | **No RLS on management queries** — access control is middleware-only (`withManagementAuth`, `withRole`) |
| R40 | **Existing client portal tables are NEVER modified** — only add new tables via new migrations |
| R41 | **Never modify applied migrations** — create new ones. Applied migrations are immutable history. |
| R42 | **Query modules are the ONLY way to access the database** — no raw SQL in route handlers |
| R43 | **All IDs are UUIDs, all timestamps are `TIMESTAMPTZ`** — consistency with client portal |

### API Response Format

| # | Rule |
|---|------|
| R44 | **Success:** `{ data: T }` |
| R45 | **Error:** `{ error: { code: string, message: string } }` |
| R46 | **Paginated:** `{ data: T[], total, page, limit, totalPages }` |
| R47 | **Rate limits:** default 100/min, auth 10/min, AI 20/min, reports 30/min, webhook 10/min |

### Commit Convention

| # | Rule |
|---|------|
| R48 | **Format:** `type(scope): short description` — single line only, no multi-line bodies, no Co-Authored-By |
| R49 | **Types:** `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `security` |
| R50 | **Scopes:** `auth`, `db`, `api`, `sync`, `ai`, `ui`, `infra`, `deps` |
| R51 | **Each commit must leave the app buildable** — never commit broken code |
| R52 | **Never commit `.env.local`, `node_modules`, `.next`** |
| R53 | **Commit after EVERY step/substep** — each step gets its own commit. Don't batch multiple steps into one commit. This keeps git history clean and makes rollbacks granular. |

### Testing

| # | Rule |
|---|------|
| R54 | **Every step verified before moving to the next** — no skipping |
| R55 | **Every phase has a checklist** — pass it all before proceeding |
| R56 | **`npm test` run twice consecutively must both pass** — no state leakage between runs |
| R57 | **New tables must be added to cleanup function** in correct FK order |
| R58 | **PR review must verify:** test data scoped, cleanup updated, no real IDs, guards used |

### Azure Naming Convention (From Brandon)

| # | Rule |
|---|------|
| R59 | **Pattern:** `[org]-[workload]-[environment]-[resourcetype]` |
| R60 | **Environments:** `dev`, `stg`, `prod` |
| R61 | **Example:** `flux-management-prod-app`, `flux-management-prod-rg` |
| R62 | **Storage accounts:** no hyphens, 24-char max (e.g., `fluxmanagementprodst`) |

### Things That Are Easy to Forget

| # | What | What Goes Wrong |
|---|------|-----------------|
| R63 | Forgetting `is_active = true` on a new aggregate query | Test org data appears in real dashboards/reports |
| R64 | Using `organization_id` from request body instead of URL param | Client could send a fake org ID |
| R65 | Forgetting `withRole` on a new sensitive endpoint | Employees see revenue or delete other people's tasks |
| R66 | Forgetting `logActivity()` on a new mutation | Missing audit trail — compliance gap |
| R67 | Adding a new table but not updating cleanup function | Test data orphaned permanently in production DB |
| R68 | Using `flux-session` cookie name | Cookie collision with client portal — unpredictable auth failures |
| R69 | Putting test data in `src/lib/db/seed.ts` | Test org gets created in production deployment |
| R70 | Calling real Planner/Claude API in tests | Creates real tasks in client's Planner, burns API credits |
| R71 | Using `SELECT *` in a "quick" query | Future sensitive columns leaked to frontend |
| R72 | Returning detailed error messages during debugging and forgetting to revert | Internal table names/SQL exposed to browser |

### Quick Reference: Before You Write Code

```
Before writing a query:
  □ Parameterized SQL? ($1, $2, never concatenation)
  □ Specific columns? (no SELECT *)
  □ Cross-org? → add WHERE o.is_active = true
  □ Writing data? → add logActivity() call

Before writing an API route:
  □ withManagementAuth wrapper?
  □ Sensitive? → withRole(['co-ceo', 'director'])
  □ Zod validation on inputs?
  □ Generic error messages?
  □ Rate limit applied?

Before writing a test:
  □ Using TEST_ORG_ID? (never a real org)
  □ Using test user IDs? (never real users)
  □ assertTestOrg() guard on writes?
  □ External APIs mocked?
  □ New table? → update cleanup.ts

Before committing (commit after EVERY step):
  □ git diff reviewed?
  □ No secrets in diff?
  □ Build passes?
  □ Commit message matches the suggested message for this step?
  □ Single line, no Co-Authored-By?
  □ Step marked ✅ DONE in this plan?
```

---

## Phase 0 — Pre-Implementation Setup

### Step 0.1: Create implementation branch ✅ DONE
> Ref: BP §1 (Architecture Overview)
> Commit: _(no commit — branch creation only)_
> Phase Strategy: Can build now — local git operation

- [x] Create `feat/backend-implementation` branch from `main`
- [x] Push branch to remote

### Step 0.2: Install backend dependencies ✅ DONE
> Ref: BP §2 (Azure Infrastructure — Environment Variables)
> Commit: `chore(deps): add backend dependencies for Azure, PostgreSQL, Graph API, and Claude`
> Files: `package.json`, `package-lock.json`
> Phase Strategy: Can build now — npm install, no external APIs

- [x] Install production dependencies:
  ```bash
  npm install pg jose @anthropic-ai/sdk @microsoft/microsoft-graph-client @azure/identity @azure/keyvault-secrets
  ```
- [x] Install dev dependencies:
  ```bash
  npm install -D @types/pg vitest dotenv
  ```
- [x] Note: `vitest` is needed for test runner, `dotenv` for loading env vars in scripts
- [x] Verify `zod` is already installed (check `package.json`)
- [x] `pg` — PostgreSQL client
- [x] `@types/pg` — TypeScript types for pg
- [x] `jose` — JWT creation/verification → BP §3 (Auth — JWT Payload)
- [x] `@anthropic-ai/sdk` — Claude API client → BP §7 (AI Assistant), EA §Claude API
- [x] `@microsoft/microsoft-graph-client` — Graph API client → BP §6 (Integration Details)
- [x] `@azure/identity` — Azure authentication → BP §3 (Auth — Azure AD Setup)
- [x] `@azure/keyvault-secrets` — Secret management → SO §8 (Secrets Management)
- [x] Run `npm audit` — 8 vulnerabilities found, all fixed with `npm audit fix`, 0 remaining
- [x] Verify build still passes: `npm run build`

### Step 0.3: Create `.env.local` template ✅ DONE
> Ref: BP §2 (Azure Infrastructure — Environment Variables), SO §8 (Secrets Management)
> Commit: `chore(infra): add environment variable template and .env.example`
> Files: `.env.example`
> DO NOT commit `.env.local`
> Phase Strategy: Can build now — local config only

- [x] Create `.env.example` with all required variables (see BP §2) — **empty values only, no real secrets**
  - Document which values are **shared** with client portal: `DATABASE_URL`, `ATERA_API_KEY`, `ANTHROPIC_API_KEY`, `AZURE_AD_TENANT_ID`, `AZURE_KEY_VAULT_URL`
  - Document which values are **management-specific**: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_REDIRECT_URI`, `JWT_SECRET`, `CONTACT_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
- [x] Create `.env.local` with development values (gitignored)
- [x] Update `package.json` dev script to use port 3001 (avoids conflict with client portal on 3000):
  ```json
  "dev": "next dev -p 3001"
  ```
- [x] Verify `.env.local` is in `.gitignore` → SO §8 rule: `.env.local` is gitignored, never committed
- [x] Verify `.env.example` has no real secrets — only placeholder/default values

### Step 0.4: Scaffold backend folder structure ✅ DONE
> Ref: BP §12 (Folder Structure)
> Commit: `chore(infra): scaffold backend folder structure with placeholder files`
> Files: all new directories and placeholder `.ts` files
> Phase Strategy: Can build now — empty file creation only

**Placeholder file convention:** Every placeholder file contains:
```typescript
// TODO: Implement — see docs/implementation-plan.md
export {};
```

- [x] Create `src/lib/db/client.ts` (placeholder)
- [x] Create `src/lib/db/migrations/` directory
- [x] Create `src/lib/db/queries/` with placeholders: `clients.ts`, `tickets.ts`, `projects.ts`, `team.ts`, `reports.ts`, `ai.ts`, `notifications.ts`, `contact-submissions.ts`, `activity-log.ts`, `report-snapshots.ts`
- [x] Create `src/lib/auth/` with placeholders: `azure-ad.ts`, `session.ts`, `middleware.ts`
- [x] Create `src/lib/integrations/graph/planner-write.ts` (placeholder)
- [x] Create `src/lib/integrations/claude/` with placeholders: `client.ts`, `context-builder.ts`, `system-prompt.ts`
- [x] Create `src/lib/integrations/mail/sender.ts` (placeholder)
- [x] Create `src/lib/api/` with placeholders: `client.ts`, `response.ts`, `rate-limit.ts`, `query-client.ts`
- [x] Create `src/lib/validators/` with placeholders: `clients.ts`, `tickets.ts`, `projects.ts`, `team.ts`, `reports.ts`, `ai.ts`, `notifications.ts`, `contact-submissions.ts`, `settings.ts`
- [x] Create `src/hooks/` directory (already exists)
- [x] Create `src/__tests__/` directory with subdirectories: `phase-1/`, `phase-2/`, `phase-3/`, `phase-4/`, `phase-5/`, `phase-7/`, `integration/`
- [x] Verify build passes: `npm run build`

### Step 0.5: Consolidate and extend types ✅ DONE
> Ref: BP §4 (Database Schema — New Tables), BP §5 (API Routes — Response Format)
> Commit: `refactor(types): consolidate types into src/types and add management-specific types`
> Files: `src/types/index.ts`, `src/data/types.ts`
> Phase Strategy: Can build now — TypeScript refactor only

- [x] Move types from `src/data/types.ts` to `src/types/index.ts`
- [x] Add backend types: `AuthUser`, `RequestContext`, `ApiResponse`, `PaginatedResponse` → BP §5 (API Response Format)
- [x] Add management-specific types: `ClientProfile`, `TeamMemberProfile`, `ContactFormSubmission`, `ReportSnapshot`, `ConnectorName`, `ConnectorStatusValue`, `SyncResult` → BP §4
- [x] Re-export from `src/data/types.ts` for backwards compatibility (15 existing imports unaffected)
- [x] Verify build passes + `tsc --noEmit` zero errors

### Step 0.6: Set up test infrastructure ✅ DONE
> Ref: BP §10 (Test Strategy — all sections), SO §11 (Test Data Isolation — all 13 rules)
> **This step establishes the safety framework for all subsequent testing. Do not skip.**
> Commit: `test(infra): add test org, seed data, cleanup, and safety guards`
> Files: `src/__tests__/test-constants.ts`, `src/__tests__/seed-test-data.ts`, `src/__tests__/cleanup.ts`, `src/__tests__/guards.ts`, `src/__tests__/setup.ts`, `src/__tests__/teardown.ts`, `vitest.config.ts`, `package.json`
> Phase Strategy: Can build now — local DB write to test org only

- [x] Create `src/__tests__/test-constants.ts` — 6 constants + TEST_USER_IDS array
- [x] Create `src/__tests__/seed-test-data.ts` — test org (is_active=false), 4 users, 5 tickets, 2 projects. All idempotent.
- [x] Create `src/__tests__/cleanup.ts` — FK-ordered cleanup across all 22 tables. Scoped by TEST_ORG_ID + TEST_EMAIL_DOMAIN.
- [x] Create `src/__tests__/guards.ts` — assertTestOrg(), assertTestUser(), assertTestEmail()
- [x] Create `src/__tests__/setup.ts` — Global setup: cleanup → seed
- [x] Create `src/__tests__/teardown.ts` — Global teardown: cleanup
- [x] Create `vitest.config.ts` — global setup, dotenv loading, path alias
- [x] Add npm scripts: `test`, `test:watch`, `test:seed`, `test:cleanup`
- [ ] **Pending manual verification:** Run `npm run test:seed` once DATABASE_URL is configured with real credentials

---

## Phase 1 — Database Foundation

### Step 1.1: PostgreSQL connection client ✅ DONE
> Ref: BP §1 (Architecture — Core Principles: "Cross-org access"), BP §4 (Database Schema — Database Connection), SO §2 (Data Access Model)
> Commit: `feat(db): add PostgreSQL connection pool without org scoping`
> Files: `src/lib/db/client.ts`
> Phase Strategy: Can build now — uses existing local PostgreSQL

- [x] Create `src/lib/db/client.ts` — Pool (max 20, 10s timeout, 30s idle, SSL in prod)
- [x] Configure connection pool using `DATABASE_URL` env var
- [x] **No `withOrgScope()` wrapper** — management portal queries are cross-org
- [x] Add connection error handling (`pool.on("error")`)
- [x] Test connection — verified: `SELECT 1` works, 4 organizations visible (3 real + 1 test)

### Step 1.2: Write migration `005_management_tables.sql`
> Ref: BP §4 (Database Schema — New Tables, full SQL for all 7 tables)
> Commit: `feat(db): add management tables migration with 7 new tables`
> Files: `src/lib/db/migrations/005_management_tables.sql`
> Phase Strategy: Can build now — local PostgreSQL, no external dependency

- [ ] Create 7 new tables as specified in BP §4:
  - `client_profiles` → BP §4 table 1
  - `team_members` → BP §4 table 2
  - `internal_notes` → BP §4 table 3
  - `activity_log` → BP §4 table 4, SO §5 (Audit Logging)
  - `report_snapshots` → BP §4 table 5
  - `contact_form_submissions` → BP §4 table 6
  - `management_notifications` → BP §4 table 7, BP §8 (Notification System)
- [ ] Add all indexes as specified in BP §4 (each table's `CREATE INDEX` statements)
- [ ] Wrap in `BEGIN/COMMIT` transaction
- [ ] Use `CREATE TABLE IF NOT EXISTS` for idempotency

### Step 1.3: Write migration `006_extend_user_roles.sql`
> Ref: BP §4 (Database Schema — Migration: `006_extend_user_roles.sql`), BP §3 (Auth — Roles & Permissions Matrix)
> Commit: `feat(db): extend user role constraint to include co-ceo`
> Files: `src/lib/db/migrations/006_extend_user_roles.sql`
> Phase Strategy: Can build now — local PostgreSQL

- [ ] Drop existing `users_role_check` constraint
- [ ] Add new constraint allowing `co-ceo` role:
  `CHECK (role IN ('client', 'employee', 'director', 'admin', 'co-ceo'))`

### Step 1.4: Write production seed script
> Ref: BP §4 (Database Schema), BP §3 (Auth — Target Users: Brandon Devier, Zack Devier, Brandon Herring)
> **IMPORTANT:** This is the PRODUCTION seed script. It must NEVER contain test data. → SO §11 Rule 12
> Commit: `feat(db): add migration runner and production seed with management users`
> Files: `src/lib/db/seed.ts`, `src/lib/db/migrate.ts`, `package.json`
> Phase Strategy: Can build now — local PostgreSQL

- [ ] Create `src/lib/db/seed.ts` — **production data only, no test org, no test users**
- [ ] Add migration runner `src/lib/db/migrate.ts`
  - **IMPORTANT:** Use the same `_migrations` tracking table as the client portal (the client portal's runner creates `_migrations` table and records applied filenames)
  - The runner must check `_migrations` for already-applied files and only run pending ones
  - Only include 005-006 in the management portal's `migrations/` folder — never 001-004 (those belong to the client portal repo)
  - Adapt the pattern from `Flux-client/src/lib/db/migrate.ts`
- [ ] Seed management users (Brandon Devier as co-ceo, Brandon Herring as director, etc.) → BP §1 (Target Users table)
- [ ] Seed `client_profiles` for existing organizations (Armada, OnPoint, etc.) → BP §4 table 1
- [ ] Seed `team_members` entries for management users → BP §4 table 2
- [ ] Add `npm run db:migrate` and `npm run db:seed` scripts to package.json
- [ ] Run migrations and seed on dev database
- [ ] Verify tables created correctly
- [ ] **Verify:** test org (`flux-qa-internal`) is NOT in `src/lib/db/seed.ts` → SO §11 Rule 12

### Step 1.5: Verify test infrastructure against new tables
> Ref: BP §10 (Test Strategy), SO §11 (Test Data Isolation)
> Commit: `test(db): update test seed and cleanup for management tables`
> Files: `src/__tests__/seed-test-data.ts`, `src/__tests__/cleanup.ts`
> Phase Strategy: Can build now — follows Step 0.6 test infrastructure

- [ ] Update `src/__tests__/seed-test-data.ts` to include seed data for all 7 new management tables
- [ ] Update `src/__tests__/cleanup.ts` to include cleanup for all 7 new management tables (in FK order)
- [ ] Run `npm test` → verify test seed creates data in new tables
- [ ] Run `npm test` → verify cleanup removes all test data from new tables
- [ ] Verify real seed data (from Step 1.4) is NOT deleted by test cleanup

### Step 1.6: Verify client portal still works
> Ref: Shared database — migrations must not break existing portal
> Commit: _(no commit — verification only)_
> Files: none (verification step)
> Phase Strategy: Critical safety check

- [ ] Start the client portal (`cd ../Flux-client && npm run dev`)
- [ ] Verify dashboard loads with real data
- [ ] Verify tickets page loads
- [ ] Verify no errors in browser console related to database schema
- [ ] Stop the client portal
- [ ] This confirms migrations 005-006 did not break the existing client portal

---

## Phase 2 — Authentication

### Step 2.1: Azure AD configuration helper ✅ DONE
> Ref: BP §3 (Auth — Azure AD Setup, Auth Flow steps 1-4), SO §3 (Authentication Security — Separate App Registration)
> Commit: `feat(auth): add Azure AD OAuth2 configuration and helpers`
> Files: `src/lib/auth/azure-ad.ts`
> Phase Strategy: Code written using client portal as reference. Testing requires Azure AD app registration from Brandon.

- [x] Create `src/lib/auth/azure-ad.ts`
- [x] Configure for management app registration (`flux-management-portal`) → BP §3 (Azure AD Setup: app name, redirect URI, permissions)
- [x] OAuth2 authorization URL builder with PKCE → BP §3 (Auth Flow step 1-2)
- [x] Token exchange function → BP §3 (Auth Flow step 4)
- [x] ID token validation (signature, issuer, audience, nonce) → BP §3 (Auth Flow step 4)

### Step 2.2: JWT session management ✅ DONE
> Ref: BP §3 (Auth — JWT Payload, Cookie Configuration), SO §3 (Cookie Isolation)
> Commit: `feat(auth): add JWT session management with management-specific cookie`
> Files: `src/lib/auth/session.ts`

- [x] Create `src/lib/auth/session.ts`
- [x] JWT creation with payload: `userId`, `email`, `name`, `role` (no `organizationId`) → BP §3 (JWT Payload)
- [x] JWT verification function
- [x] Cookie name: `flux-management-session` → BP §3 (Cookie Configuration), SO §3 (Cookie Isolation)
- [x] Cookie config: HTTP-only, Secure, SameSite=Lax, 24h expiry → BP §3 (Cookie Configuration)
- [x] Session revocation via in-memory JTI set

### Step 2.3: Auth middleware ✅ DONE
> Ref: BP §3 (Auth — Middleware), BP §5 (API Routes — Route Handler Pattern), SO §4 (Role-Based Access Control — Enforcement Pattern)
> Commit: `feat(auth): add withManagementAuth and withRole middleware`
> Files: `src/lib/auth/middleware.ts`

- [x] Create `src/lib/auth/middleware.ts`
- [x] `withManagementAuth(request, handler)` — extract JWT, verify, lookup user, pass context → BP §3 (Middleware — withManagementAuth)
- [x] `withRole(request, allowedRoles, handler)` — restrict by role → BP §3 (Middleware — withRole), SO §4 (Sensitive Endpoints list)
- [x] `withWebhookAuth(request, handler)` — API key auth for contact form webhook
- [x] Return 401 for missing/invalid token, 403 for insufficient role → BP §3 (Auth — Role Verification)
- [x] Reject users with `client` role → SO §3 (Role Verification: "If user role is client, access is denied")
- [x] Also implemented prerequisites: `src/lib/api/response.ts`, `src/lib/api/rate-limit.ts`, `src/lib/db/queries/users.ts`

### Step 2.4: Auth API routes ✅ DONE
> Ref: BP §5 (API Routes — Auth Routes), BP §3 (Auth Flow steps 1-8)
> Commit: `feat(auth): add login, callback, logout, me, and dev-login API routes`
> Files: `src/app/api/auth/login/route.ts`, `src/app/api/auth/callback/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/app/api/auth/dev-login/route.ts`

- [x] `GET /api/auth/login` — Initiate Azure AD OAuth2 flow → BP §3 (Auth Flow steps 1-2)
- [x] `GET /api/auth/callback` — Exchange code, validate tokens, create session → BP §3 (Auth Flow steps 3-8)
- [x] `GET /api/auth/logout` — Revoke JTI, clear session cookie
- [x] `GET /api/auth/me` — Return current user info (no organizationId)
- [x] `GET /api/auth/dev-login` — Dev-only bypass (ENABLE_TEST_LOGIN=true), rejects client role
- [x] Callback rejects `client` role users at login time [R25]
- [x] All routes use port 3001 default URL

### Step 2.5: Security headers ✅ DONE
> Ref: SO §1 (Security Inheritance — Security headers list), BP §9 (Security — Inherited from Client Portal)
> Commit: `security(auth): add security headers to next.config.ts`
> Files: `next.config.ts`

- [x] Add security headers to `next.config.ts`:
  - Strict-Transport-Security (max-age=63072000, includeSubDomains, preload)
  - X-Content-Type-Options (nosniff)
  - X-Frame-Options (DENY)
  - Content-Security-Policy (default-src 'self', connect-src includes login.microsoftonline.com, frame-ancestors 'none')
  - Referrer-Policy (strict-origin-when-cross-origin)

### Step 2.6: Wire login page + route protection ✅ DONE
> Ref: BP §3 (Auth Flow), SO §3 (Role Verification)
> Commit: `feat(auth): wire login page to Azure AD and add route protection`
> Files: `src/app/login/page.tsx`, `src/middleware.ts`

- [x] Update login page — SSO button calls `/api/auth/login`, removed mock email/password form
- [x] Add error message display for auth failures (auth_failed, access_denied, account_disabled, rate_limited)
- [x] Add `src/middleware.ts` for route protection (redirect to `/login` if no `flux-management-session` cookie)
- [x] Add dev-login bypass buttons for Brandon, Zack, Cameron (dev only)
- [x] Wrapped `useSearchParams` in Suspense boundary (Next.js 16 requirement)
- [x] Build verified — all routes compile, middleware active

---

## Phase 3 — Database Query Modules

### Step 3.1: `clients.ts` ✅ DONE
> Ref: BP §5 (API Routes — Clients), BP §4 (Schema — `client_profiles` table, `organizations` table)
> Security: SO §9 (parameterized SQL, no `SELECT *`), SO §5 (audit log on updates)
> Commit: `feat(db): add client query module with cross-org list and is_active filter`
> Files: `src/lib/db/queries/clients.ts`
> Phase Strategy: Can build now — pure PostgreSQL, no external APIs

- [x] `listClients(filters)` — Join `organizations` + `client_profiles` + ticket/project counts + SLA %. **`WHERE o.is_active = true`** enforced (R11). Supports search, industry, healthScore, contractStatus, pagination, sorting.
- [x] `getClient(clientId)` — Full client detail by org ID. No `is_active` filter on single lookup (R13).
- [x] `updateClientProfile(clientId, data)` — Dynamic field update with parameterized SQL (R15). Returns updated row.
- [x] `getClientStats(clientId, range)` — Ticket trends, resolution time, project progress over 7d/30d/90d.
- [x] Tests: 12 tests in `src/__tests__/phase-3/clients.test.ts` — all pass, R56 verified (two consecutive runs).

### Step 3.2: `tickets.ts` ✅ DONE
> Ref: BP §5 (API Routes — Tickets), BP §4 (Schema — shared `tickets`, `ticket_activities`, `ticket_attachments` tables + new `internal_notes`)
> Security: SO §9 (parameterized SQL, no `SELECT *`), SO §5 (audit log on note creation)
> Commit: `feat(db): add ticket query module with cross-org list and internal notes`
> Files: `src/lib/db/queries/tickets.ts`

- [x] `listTickets(filters)` — Cross-org with pagination, status/priority/client/assignee/search filters. `WHERE o.is_active = true` enforced (R11). Returns `clientId`/`clientName` per ticket.
- [x] `getTicket(ticketId)` — Detail with activities, attachments, and internal notes (management-only). No `is_active` filter (R13).
- [x] `getTicketStats(filters)` — Cross-client metrics: open/pending/closed/critical counts, avg resolution. `is_active` filter enforced (R11). Supports `clientId` and `range`.
- [x] `getTicketChartData(clientId, range)` — Daily created/resolved counts via `generate_series`.
- [x] `addInternalNote(ticketId, authorId, content)` — Insert into `internal_notes` table.
- [x] Tests: 12 tests in `src/__tests__/phase-3/tickets.test.ts` — all pass.

### Step 3.3: `projects.ts` ✅ DONE
> Ref: BP §5 (API Routes — Projects), BP §4 (Schema — shared `projects`, `project_tasks` tables), BP §6 (Integration — Task Write-Back)
> Security: SO §5 (audit log on task CRUD), EA §Microsoft Graph API (Planner write rules)
> Commit: `feat(db): add project query module with task CRUD operations`
> Files: `src/lib/db/queries/projects.ts`

- [x] `listProjects(filters)` — Cross-org with status/client/search filters, pagination, sorting. `WHERE o.is_active = true` enforced (R11).
- [x] `getProject(projectId)` — Detail with tasks and assignees. No `is_active` filter (R13).
- [x] `getProjectStats(filters)` — Cross-client summary: on-track/at-risk/delayed, avg progress, task totals. `is_active` filter enforced (R11).
- [x] `createTask(projectId, orgId, data)` — Insert into `project_tasks` with generated `planner_task_id`.
- [x] `updateTask(taskId, data)` — Dynamic field update. Sets `completed_at` when status is Complete.
- [x] `deleteTask(taskId)` — Delete from `project_tasks`. Returns boolean.
- [x] `getTaskById(taskId)` — For ownership checks in API layer.
- [x] Tests: 13 tests in `src/__tests__/phase-3/projects.test.ts` — all pass.

### Step 3.4: `team.ts` ✅ DONE
> Ref: BP §5 (API Routes — Team), BP §4 (Schema — `team_members` table + shared `users` table)
> Security: SO §4 (co-ceo/director only for updates), SO §5 (audit log on updates)
> Commit: `feat(db): add team query module with computed metrics`
> Files: `src/lib/db/queries/team.ts`

- [x] `listTeamMembers()` — Join `users` + `team_members` + computed metrics (tickets resolved, active tasks, avg resolution hours).
- [x] `getTeamMember(userId)` — Detail with performance metrics and profile info.
- [x] `updateTeamMember(userId, data)` — Dynamic field update for capacity, utilization, department, status, hire date.
- [x] Tests: 5 tests in `src/__tests__/phase-3/team.test.ts` — all pass.

### Step 3.5: `reports.ts` ✅ DONE
> Ref: BP §5 (API Routes — Reports), BP §4 (Schema — `report_snapshots` for historical data, `client_profiles` for revenue)
> Security: SO §4 (co-ceo/director only for all reports)
> Commit: `feat(db): add report query module with revenue, SLA, team, and ticket analytics`
> Files: `src/lib/db/queries/reports.ts`

- [x] `getRevenueReport(range)` — Per-client revenue, totals. `is_active=true` enforced (R11).
- [x] `getTeamPerformanceReport(range)` — Per-member tickets resolved, active tasks, avg resolution in range.
- [x] `getSlaComplianceReport(range)` — Per-client SLA %, resolution times vs sla_target. `is_active=true` enforced (R11).
- [x] `getTicketAnalyticsReport(clientId, range)` — Volume, priority breakdown, resolution times. `is_active=true` enforced (R11).
- [x] Tests: 8 tests in `src/__tests__/phase-3/reports.test.ts` — all pass.

### Step 3.6: `ai.ts` ✅ DONE
> Ref: BP §5 (API Routes — AI Assistant), BP §7 (AI Assistant Architecture), BP §4 (Schema — shared `ai_conversations`, `ai_messages` tables)
> Commit: `feat(db): add AI conversation and message query module`
> Files: `src/lib/db/queries/ai.ts`

- [x] `createConversation(userId, title)` — Uses first active org as context for management users (org_id=NULL).
- [x] `listConversations(userId)` — Most recent first, limit 50.
- [x] `getConversation(conversationId)` — With all messages in chronological order.
- [x] `addMessage(conversationId, role, content, tokensUsed)` — Updates conversation timestamp.
- [x] `deleteConversation(conversationId)` — CASCADE deletes messages.
- [x] Tests: 6 tests in `src/__tests__/phase-3/ai.test.ts` — all pass.

### Step 3.7: `notifications.ts` ✅ DONE
> Ref: BP §5 (API Routes — Notifications), BP §8 (Notification System — Types, Delivery Channels), BP §4 (Schema — `management_notifications` table)
> Commit: `feat(db): add management notification query module`
> Files: `src/lib/db/queries/notifications.ts`

- [x] `listNotifications(userId, filters)` — Paginated, supports type filter, ordered by created_at DESC.
- [x] `getUnreadCount(userId)` — Count of unread.
- [x] `markAsRead(userId, notificationId?)` — Mark single or all as read.
- [x] `createNotification(userId, data)` — Insert with type, title, description, link.
- [x] Tests: 6 tests in `src/__tests__/phase-3/notifications.test.ts` — all pass.

### Step 3.8: `contact-submissions.ts` ✅ DONE
> Ref: BP §5 (API Routes — Contact Submissions), BP §4 (Schema — `contact_form_submissions` table), BP §6 (Integration — Contact Form Webhook)
> Commit: `feat(db): add contact form submission query module`
> Files: `src/lib/db/queries/contact-submissions.ts`

- [x] `listSubmissions(filters)` — Paginated, supports status filter.
- [x] `updateSubmissionStatus(id, status, reviewedBy)` — Updates status and reviewer.
- [x] `createSubmission(data)` — Stores raw webhook data without modification.
- [x] Tests: 5 tests in `src/__tests__/phase-3/contact-submissions.test.ts` — all pass.

### Step 3.9: `activity-log.ts` ✅ DONE
> Ref: BP §4 (Schema — `activity_log` table), SO §5 (Audit Logging — What Gets Logged, What Does NOT Get Logged, Retention)
> Commit: `feat(db): add activity log query module for audit trail`
> Files: `src/lib/db/queries/activity-log.ts`

- [x] `logActivity(userId, action, entityType, entityId, orgId, description, metadata)` — Write audit entry with optional JSONB metadata.
- [x] `listActivityLog(filters)` — By entityType, entityId, userId, organizationId, action. Paginated, joins user name/email.
- [x] Tests: 6 tests in `src/__tests__/phase-3/activity-log.test.ts` — all pass.

### Step 3.10: `connectors.ts` ✅ DONE
> Ref: BP §4 (Schema — shared `connector_statuses` table)
> Commit: `feat(db): add connector status query module`
> Files: `src/lib/db/queries/connectors.ts`

- [x] `listConnectorStatuses()` — All statuses across active orgs with `is_active=true` (R11). Includes client name.
- [x] `getConnectorStatus(connectorName)` — Filter by connector name across active orgs.
- [x] Tests: 3 tests in `src/__tests__/phase-3/connectors.test.ts` — all pass.

### Step 3.11: `report-snapshots.ts` ✅ DONE
> Ref: BP §4 (Schema — `report_snapshots` table)
> Commit: `feat(db): add report snapshot query module for historical data`
> Files: `src/lib/db/queries/report-snapshots.ts`

- [x] `createSnapshot(reportType, period, periodDate, data)` — Idempotent via ON CONFLICT upsert.
- [x] `listSnapshots(reportType, filters)` — By type and optional period, ordered by date DESC.
- [x] `getLatestSnapshot(reportType, period)` — Most recent snapshot for cache/fallback.
- [x] Tests: 6 tests in `src/__tests__/phase-3/report-snapshots.test.ts` — all pass.

---

## Phase 4 — API Routes

### Step 4.1: API response helpers + Zod validation schemas ✅ DONE
> Ref: BP §5 (API Routes — API Response Format, Route Handler Pattern), SO §9 (API Security — Input Validation, Error Responses)
> Commit: `feat(api): add Zod validation schemas for all API inputs`
> Files: `src/lib/api/response.ts`, `src/lib/api/rate-limit.ts`, `src/lib/validators/*.ts`

- [x] `src/lib/api/response.ts` — Already implemented in Step 2.3 (`successResponse`, `paginatedResponse`, `Errors.*`)
- [x] `src/lib/api/rate-limit.ts` — Already implemented in Step 2.3 (AUTH, AI_CHAT, REPORTS, WEBHOOK, DEFAULT)
- [x] Zod schemas created for all 9 domains:
  - `clients.ts` — list, id, update, stats schemas
  - `tickets.ts` — list, id, stats, internalNote, chartData schemas
  - `projects.ts` — list, id, stats, createTask, updateTask, taskId schemas
  - `team.ts` — memberId, update schemas
  - `reports.ts` — reportRange, ticketAnalytics schemas
  - `ai.ts` — chatMessage, conversationId schemas
  - `notifications.ts` — list, markRead schemas
  - `contact-submissions.ts` — list, id, update, webhookSubmission schemas
  - `settings.ts` — profileUpdate schema

### Step 4.2: Dashboard endpoint ✅ DONE
> Ref: BP §5 (API Routes — Dashboard)
> Commit: `feat(api): add dashboard endpoint with combined KPIs`
> Files: `src/app/api/dashboard/route.ts`

- [x] `GET /api/dashboard` — Combined KPIs: revenue, tickets (open/pending/closed/critical), projects (on-track/at-risk/delayed), client health, team utilization. All queries run in parallel. `is_active=true` enforced via query modules (R11).
- [x] Wrapped with `withManagementAuth` (R23).

### Step 4.3: Client endpoints ✅ DONE
> Ref: BP §5 (API Routes — Clients), SO §4 (Sensitive Endpoints: PUT clients is co-ceo/director only)
> Commit: `feat(api): add client list, detail, update, and stats endpoints`
> Files: `src/app/api/clients/route.ts`, `src/app/api/clients/[id]/route.ts`, `src/app/api/clients/[id]/stats/route.ts`

- [x] `GET /api/clients` — List with filters, pagination, Zod validation. `withManagementAuth`.
- [x] `GET /api/clients/:id` — Detail. `withManagementAuth`.
- [x] `PUT /api/clients/:id` — Update. `withRole(['co-ceo', 'director'])`. Audit log (R29).
- [x] `GET /api/clients/:id/stats` — Client KPIs with range. `withManagementAuth`.

### Step 4.4: Ticket endpoints
> Ref: BP §5 (API Routes — Tickets), SO §9 (parameterized SQL for filters)
> Commit: `feat(api): add ticket list, detail, stats, and internal notes endpoints`
> Files: `src/app/api/tickets/route.ts`, `src/app/api/tickets/[id]/route.ts`, `src/app/api/tickets/[id]/notes/route.ts`, `src/app/api/tickets/stats/route.ts`

- [ ] `GET /api/tickets` — List with filters + pagination → BP §5 (Tickets — Filters)
- [ ] `GET /api/tickets/:id` — Detail with internal notes → BP §5 (Tickets — Returns)
- [ ] `POST /api/tickets/:id/notes` — Add internal note → BP §5 (co-ceo, director, employee), SO §5 (audit log)
- [ ] `GET /api/tickets/stats` — Cross-client metrics → BP §5 (Tickets — Returns, Filters)

### Step 4.5: Project endpoints
> Ref: BP §5 (API Routes — Projects), BP §6 (Integration — Task Write-Back), EA §Microsoft Graph API (Planner write rules)
> Commit: `feat(api): add project endpoints with task CRUD and dual-write support`
> Files: `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts`, `src/app/api/projects/[id]/stats/route.ts`, `src/app/api/projects/stats/route.ts`, `src/app/api/projects/[id]/tasks/route.ts`, `src/app/api/projects/[id]/tasks/[taskId]/route.ts`

- [ ] `GET /api/projects` — List with filters → BP §5 (Projects — Filters)
- [ ] `GET /api/projects/:id` — Detail → BP §5 (Projects — Returns)
- [ ] `GET /api/projects/:id/stats` — Project metrics
- [ ] `GET /api/projects/stats` — Cross-client summary
- [ ] `POST /api/projects/:id/tasks` — Create task → BP §6 (dual-write: DB immediate + Planner background), EA §Planner Write-Back (rules 1-6), SO §5 (audit log)
- [ ] `PUT /api/projects/:id/tasks/:taskId` — Update task → BP §5 (employee: own tasks only), SO §5 (audit log)
- [ ] `DELETE /api/projects/:id/tasks/:taskId` — Delete task → BP §5 (co-ceo/director: any task, employee: own tasks only), SO §5 (audit log)

### Step 4.6: Team endpoints
> Ref: BP §5 (API Routes — Team), SO §4 (Sensitive Endpoints: PUT team is co-ceo/director only)
> Commit: `feat(api): add team list, detail, and update endpoints`
> Files: `src/app/api/team/route.ts`, `src/app/api/team/[id]/route.ts`

- [ ] `GET /api/team` — List with computed metrics → BP §5 (Team — Returns)
- [ ] `GET /api/team/:id` — Detail → BP §5 (Team — Returns)
- [ ] `PUT /api/team/:id` — Update → BP §5 (co-ceo, director only), SO §4 (Sensitive Endpoints), SO §5 (audit log)

### Step 4.7: Report endpoints
> Ref: BP §5 (API Routes — Reports), SO §4 (co-ceo/director only for all reports), SO §4 (Employee Restrictions: "cannot view reports")
> Commit: `feat(api): add revenue, team performance, SLA, and ticket analytics report endpoints`
> Files: `src/app/api/reports/revenue/route.ts`, `src/app/api/reports/team-performance/route.ts`, `src/app/api/reports/sla-compliance/route.ts`, `src/app/api/reports/ticket-analytics/route.ts`

- [ ] `GET /api/reports/revenue` — Revenue report → BP §5 (Reports — Returns, Filters), `withRole(['co-ceo', 'director'])`
- [ ] `GET /api/reports/team-performance` — Team report → BP §5 (Reports), `withRole(['co-ceo', 'director'])`
- [ ] `GET /api/reports/sla-compliance` — SLA report → BP §5 (Reports), `withRole(['co-ceo', 'director'])`
- [ ] `GET /api/reports/ticket-analytics` — Ticket report → BP §5 (Reports), `withRole(['co-ceo', 'director'])`

### Step 4.8: AI endpoints
> Ref: BP §5 (API Routes — AI Assistant), BP §7 (AI Assistant Architecture — System Prompt, Context Builder), EA §Claude API (Safety Rules)
> Commit: `feat(api): add AI chat and conversation management endpoints`
> Files: `src/app/api/ai/chat/route.ts`, `src/app/api/ai/conversations/route.ts`, `src/app/api/ai/conversations/[id]/route.ts`

- [ ] `POST /api/ai/chat` — Send message, get Claude response → BP §7 (cross-org context), EA §Claude API (rule 5: "conversation tool only")
- [ ] `GET /api/ai/conversations` — List user's conversations
- [ ] `GET /api/ai/conversations/:id` — Get conversation messages
- [ ] `DELETE /api/ai/conversations/:id` — Delete conversation
- [ ] Rate limit: 20/min per user → SO §6 (Rate Limiting — AI Chat)

### Step 4.9: Notification endpoints
> Ref: BP §5 (API Routes — Notifications), BP §8 (Notification System — Types, Delivery Channels)
> Commit: `feat(api): add notification list, unread count, and mark-read endpoints`
> Files: `src/app/api/notifications/route.ts`, `src/app/api/notifications/unread-count/route.ts`, `src/app/api/notifications/mark-read/route.ts`

- [ ] `GET /api/notifications` — List with type filter → BP §8 (6 notification types)
- [ ] `GET /api/notifications/unread-count` — Badge count
- [ ] `PUT /api/notifications/mark-read` — Mark one or all

### Step 4.10: Contact submission endpoints
> Ref: BP §5 (API Routes — Contact Submissions), EA §Contact Form Webhook (Safety Rules), SO §4 (co-ceo/director only for list/update)
> Commit: `feat(api): add contact submission list, update, and webhook endpoints`
> Files: `src/app/api/contact-submissions/route.ts`, `src/app/api/contact-submissions/[id]/route.ts`, `src/app/api/contact-submissions/webhook/route.ts`

- [ ] `GET /api/contact-submissions` — List → SO §4 (Sensitive Endpoints: co-ceo, director only)
- [ ] `PUT /api/contact-submissions/:id` — Update status → SO §5 (audit log), SO §4 (co-ceo, director only)
- [ ] `POST /api/contact-submissions/webhook` — Receive from flux-app → EA §Contact Form Webhook (X-API-Secret auth, Zod validation, rate limit 10/min), SO §9 (Webhook Security)

### Step 4.11: Settings endpoints
> Ref: BP §5 (API Routes — Settings)
> Commit: `feat(api): add profile settings get and update endpoints`
> Files: `src/app/api/settings/profile/route.ts`

- [ ] `GET /api/settings/profile` — Current user's profile
- [ ] `PUT /api/settings/profile` — Update name, phone, notification prefs → SO §9 (Input Validation)

---

## Phase 5 — Integrations

### Step 5.1: Planner write-back client
> Ref: BP §6 (Integration Details — Task Write-Back to Planner), EA §Microsoft Graph API (Write Operations — Planner rules 1-6), EA §Error Handling (Planner Write-Back code example)
> Commit: `feat(sync): add Planner task write-back client with background execution`
> Files: `src/lib/integrations/graph/planner-write.ts`
> Phase Strategy: **May be blocked** — needs `Tasks.ReadWrite.All` admin consent from Brandon. Build code + test with mocks. Wire to real API when permission arrives.

- [ ] Create `src/lib/integrations/graph/planner-write.ts`
- [ ] `createPlannerTask(planId, data)` — POST to Graph API → EA §Microsoft Graph API (POST /planner/tasks)
- [ ] `updatePlannerTask(taskId, data)` — PATCH to Graph API → EA §Microsoft Graph API (PATCH /planner/tasks/{id})
- [ ] `deletePlannerTask(taskId)` — DELETE from Graph API → EA §Microsoft Graph API (DELETE /planner/tasks/{id})
- [ ] Background execution — non-blocking, log errors → EA §Error Handling ("External API failures should NEVER block user actions")
- [ ] Never modify plans or buckets — only tasks → EA §Planner Write-Back (rule 5)
- [ ] Test with real Planner API (requires `Tasks.ReadWrite.All` permission) → BP §3 (Azure AD — API Permissions)

### Step 5.2: Claude AI context builder
> Ref: BP §7 (AI Assistant Architecture — System Prompt Template, Context Builder), EA §Claude API (Safety Rules 1-5)
> Commit: `feat(ai): add Claude client, cross-org context builder, and management system prompt`
> Files: `src/lib/integrations/claude/client.ts`, `src/lib/integrations/claude/context-builder.ts`, `src/lib/integrations/claude/system-prompt.ts`
> Phase Strategy: Can build now — Anthropic API key available

- [ ] Create `src/lib/integrations/claude/client.ts` — API wrapper → BP §12 (Files That Can Be Adapted: identical to client portal)
- [ ] Create `src/lib/integrations/claude/context-builder.ts` — Cross-org context → BP §7 (Context Builder function)
  - Query all client profiles, ticket stats, project stats, team metrics, revenue → BP §7 (Context Builder — 5 parallel queries)
  - **Must filter `WHERE o.is_active = true` to exclude test org from AI context** → BP §10, SO §11 Rule 7
  - Format into structured context string
- [ ] Create `src/lib/integrations/claude/system-prompt.ts` — Management persona → BP §7 (System Prompt Template)
- [ ] Never send raw credentials in prompt → EA §Claude API (rule 1)
- [ ] Include disclaimer: "Verify critical information" → EA §Claude API (rule 3)
- [ ] Test AI responses with cross-org context

### Step 5.3: Email notification sender
> Ref: BP §6 (Integration — Reused: Email Notifications), BP §8 (Notification System — Delivery Channels), EA §Microsoft Graph API (Outlook Mail rules)
> Commit: `feat(sync): add email notification sender via Graph API Mail.Send`
> Files: `src/lib/integrations/mail/sender.ts`
> Phase Strategy: Can build now — Mail.Send permission available

- [ ] Create `src/lib/integrations/mail/sender.ts` → BP §12 (Files That Can Be Adapted: identical to client portal)
- [ ] Reuse Graph API `Mail.Send` pattern from client portal
- [ ] Templates for: ticket escalation, contact form alert, task assignment → BP §8 (Notification Types table)
- [ ] Only send to Flux employees and known contacts → EA §Outlook Mail ("Never send bulk/marketing emails")
- [ ] Test email delivery

### Step 5.4: Contact form webhook
> Ref: BP §6 (Integration — Contact Form Webhook), EA §Contact Form Webhook (Safety Rules 1-5)
> Commit: `feat(sync): add contact form webhook receiver and flux-app integration`
> Files: `src/app/api/contact-submissions/webhook/route.ts`, updates to `flux-app` contact form
> Phase Strategy: Can build now — pure code, no external dependency

- [ ] Update `flux-app` contact form to POST to management portal webhook → BP §6 (Contact Form Webhook flow)
- [ ] OR: add dual-submit (Google Sheets + management portal)
- [ ] Authenticate via `X-API-Secret` header → EA §Contact Form Webhook (rule: "Authenticated via X-API-Secret header")
- [ ] Store raw submission — do not modify → EA §Contact Form Webhook (rule 4)
- [ ] Test end-to-end: form submit → DB insert → notification created → BP §8 (Notification Flow)

---

## Phase 6 — Frontend Integration

### Step 6.1: Frontend API client
> Ref: BP §11 (Folder Structure — `lib/api/client.ts`), BP §12 (Files That Can Be Adapted: identical pattern)
> Commit: `feat(ui): add frontend API client with auth cookie support`
> Files: `src/lib/api/client.ts`
> Phase Strategy: Can build now — pure frontend code

- [ ] Create `src/lib/api/client.ts` — Fetch wrapper with `credentials: 'include'`
- [ ] Auto-redirect to `/login` on 401 responses

### Step 6.2: React Query setup
> Ref: BP §11 (Folder Structure — `lib/api/query-client.ts`), BP §12 (Files That Can Be Adapted: identical pattern, new query keys)
> Commit: `feat(ui): configure React Query with query key factory`
> Files: `src/lib/api/query-client.ts`, `src/app/layout.tsx`

- [ ] Create `src/lib/api/query-client.ts` — React Query config (60s stale time, retry 1)
- [ ] Add `QueryClientProvider` to root layout
- [ ] Create query key factory for all domains

### Step 6.3: React Query hooks
> Ref: BP §11 (Folder Structure — hooks directory), BP §5 (API Routes — all endpoints define what hooks fetch)
> Commit: `feat(ui): add React Query hooks for all data domains`
> Files: `src/hooks/use-auth.ts`, `src/hooks/use-clients.ts`, `src/hooks/use-tickets.ts`, `src/hooks/use-projects.ts`, `src/hooks/use-team.ts`, `src/hooks/use-reports.ts`, `src/hooks/use-ai.ts`, `src/hooks/use-notifications.ts`, `src/hooks/use-contact-submissions.ts`

- [ ] Create hooks in `src/hooks/`:
  - `use-auth.ts` — `useAuth()` → BP §5 (GET /api/auth/me)
  - `use-clients.ts` — `useClients()`, `useClient()`, `useClientStats()`, `useUpdateClient()` → BP §5 (Clients endpoints)
  - `use-tickets.ts` — `useTickets()`, `useTicket()`, `useTicketStats()`, `useAddNote()` → BP §5 (Tickets endpoints)
  - `use-projects.ts` — `useProjects()`, `useProject()`, `useProjectStats()`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` → BP §5 (Projects endpoints)
  - `use-team.ts` — `useTeam()`, `useTeamMember()`, `useUpdateTeamMember()` → BP §5 (Team endpoints)
  - `use-reports.ts` — `useRevenueReport()`, `useTeamPerformanceReport()`, `useSlaReport()`, `useTicketAnalyticsReport()` → BP §5 (Reports endpoints)
  - `use-ai.ts` — `useSendMessage()`, `useConversations()`, `useConversation()`, `useDeleteConversation()` → BP §5 (AI endpoints)
  - `use-notifications.ts` — `useNotifications()`, `useUnreadCount()`, `useMarkRead()` → BP §5 (Notifications endpoints)
  - `use-contact-submissions.ts` — `useContactSubmissions()`, `useUpdateSubmission()` → BP §5 (Contact Submissions endpoints)

### Step 6.4: Wire dashboard page
> Ref: BP §5 (API Routes — Dashboard)
> Commit: `feat(ui): wire dashboard page to real API data`
> Files: `src/app/(portal)/dashboard/page.tsx`

- [ ] Replace mock data with `useDashboard()` hook → BP §5 (Dashboard — Response includes)
- [ ] Handle loading/error states

### Step 6.5: Wire clients page + client detail
> Ref: BP §5 (API Routes — Clients)
> Commit: `feat(ui): wire clients page and client detail to real API data`
> Files: `src/app/(portal)/clients/page.tsx`, `src/app/(portal)/clients/[id]/page.tsx`

- [ ] Replace mock data with `useClients()`, `useClient()`, `useClientStats()`
- [ ] Wire client profile edit form to `useUpdateClient()` → BP §5 (PUT /api/clients/:id)
- [ ] Handle loading/error states

### Step 6.6: Wire tickets page + slide-over
> Ref: BP §5 (API Routes — Tickets)
> Commit: `feat(ui): wire tickets page and slide-over to real API data`
> Files: `src/app/(portal)/tickets/page.tsx`, `src/components/shared/ticket-slide-over.tsx`

- [ ] Replace mock data with `useTickets()`, `useTicket()`, `useTicketStats()`
- [ ] Wire internal notes form to `useAddNote()` → BP §5 (POST /api/tickets/:id/notes)
- [ ] Handle loading/error states

### Step 6.7: Wire projects page + project detail + task CRUD
> Ref: BP §5 (API Routes — Projects), BP §6 (Integration — Task Write-Back)
> Commit: `feat(ui): wire projects page with task CRUD mutations`
> Files: `src/app/(portal)/projects/page.tsx`, `src/app/(portal)/projects/[id]/page.tsx`

- [ ] Replace mock data with `useProjects()`, `useProject()`
- [ ] Wire task create/update/delete to mutations → BP §6 (dual-write: DB + Planner)
- [ ] Handle loading/error/optimistic states

### Step 6.8: Wire team page
> Ref: BP §5 (API Routes — Team)
> Commit: `feat(ui): wire team page to real API data`
> Files: `src/app/(portal)/team/page.tsx`

- [ ] Replace mock data with `useTeam()`, `useTeamMember()`
- [ ] Wire team member edit to `useUpdateTeamMember()` → BP §5 (PUT /api/team/:id)

### Step 6.9: Wire reports pages
> Ref: BP §5 (API Routes — Reports)
> Commit: `feat(ui): wire all four report pages to real API data`
> Files: `src/app/(portal)/reports/[reportType]/page.tsx`

- [ ] Wire revenue report to `useRevenueReport()` → BP §5 (GET /api/reports/revenue)
- [ ] Wire team performance report to `useTeamPerformanceReport()` → BP §5 (GET /api/reports/team-performance)
- [ ] Wire SLA compliance report to `useSlaReport()` → BP §5 (GET /api/reports/sla-compliance)
- [ ] Wire ticket analytics report to `useTicketAnalyticsReport()` → BP §5 (GET /api/reports/ticket-analytics)

### Step 6.10: Wire AI assistant page
> Ref: BP §5 (API Routes — AI Assistant), BP §7 (AI Assistant Architecture)
> Commit: `feat(ui): wire AI assistant page to real Claude API`
> Files: `src/app/(portal)/ai-assistant/page.tsx`

- [ ] Replace mock data with `useSendMessage()`, `useConversations()` → BP §7 (cross-org context)
- [ ] Handle streaming/loading states
- [ ] Show disclaimer → EA §Claude API (rule 3: "Verify critical information")

### Step 6.11: Wire settings page
> Ref: BP §5 (API Routes — Settings)
> Commit: `feat(ui): wire settings page to real API data`
> Files: `src/app/(portal)/settings/page.tsx`

- [ ] Replace hardcoded data with `useAuth()` and profile hooks

### Step 6.12: Wire notifications + contact submissions
> Ref: BP §5 (API Routes — Notifications, Contact Submissions), BP §8 (Notification System)
> Commit: `feat(ui): wire notifications and contact submissions to real API data`
> Files: `src/components/overlays/notification-dropdown/notification-dropdown.tsx`, `src/components/overlays/user-dropdown/user-dropdown.tsx`

- [ ] Wire notification dropdown to `useNotifications()`, `useUnreadCount()` → BP §8 (Notification Types)
- [ ] Wire contact submissions page to `useContactSubmissions()`

### Step 6.13: Remove mock data files
> Ref: BP §1 (Architecture — Data Flow: all data from API now)
> Commit: `chore(cleanup): remove unused mock data files`
> Files: delete `src/data/mock-*.ts`

- [ ] Delete all files in `src/data/mock-*.ts`
- [ ] Verify no remaining imports of mock data
- [ ] Build passes without mock data

---

## Phase 7 — Security Hardening

### Step 7.1: Rate limiting
> Ref: SO §6 (Rate Limiting — table with all limits), BP §9 (Security — Rate Limits table)
> Commit: `security(api): implement rate limiting for all API routes`
> Files: `src/lib/api/rate-limit.ts`, all `route.ts` files
> Phase Strategy: Can build now — pure code, no external APIs

- [ ] Apply rate limits to all routes:
  - Default: 100/min per user → SO §6
  - Auth: 10/min per IP → SO §6
  - AI Chat: 20/min per user → SO §6
  - Reports: 30/min per user → SO §6
  - Contact webhook: 10/min per API key → SO §6

### Step 7.2: Error boundary and error pages
> Ref: SO §9 (API Security — Error Responses: "generic messages only"), SO §1 (Security Inheritance — "never expose table names, stack traces")
> Commit: `feat(ui): add error boundary, 404 page, and generic error handling`
> Files: `src/app/not-found.tsx`, `src/app/error.tsx`

- [ ] Add error boundary component
- [ ] Create custom 404 page
- [ ] Create custom error page
- [ ] Verify generic error messages (no internals exposed) → SO §9 (Error Response examples: GOOD vs BAD)

### Step 7.3: Audit logging integration
> Ref: SO §5 (Audit Logging — What Gets Logged, What Does NOT Get Logged, Retention)
> Commit: `security(api): verify and complete audit logging on all mutation endpoints`
> Files: all mutation `route.ts` files (verify `logActivity()` calls)

- [ ] Verify all mutation endpoints write to `activity_log` → SO §5 (field definitions table)
- [ ] Test audit trail completeness
- [ ] Verify read-only operations are NOT logged → SO §5 (What Does NOT Get Logged)

### Step 7.4: Test suites
> Ref: SO §4 (Role-Based Access Control — full permissions matrix), SO §2 (Data Access Model), SO §9 (Input Validation)
> Commit: `test(security): add role access, input validation, and data isolation test suites`
> Files: `src/__tests__/phase-7/role-access.test.ts`, `src/__tests__/phase-7/input-validation.test.ts`, `src/__tests__/phase-7/audit-logging.test.ts`, `src/__tests__/phase-7/is-active-filter.test.ts`

- [ ] Authentication flow tests — verify role-based access → SO §4 (Roles & Permissions Matrix)
- [ ] Input validation tests — verify Zod schemas reject bad input → SO §9 (Input Validation)
- [ ] Cross-org access tests — verify management users can see all orgs → SO §2 (Data Access Model — Why This Is Acceptable)
- [ ] Role restriction tests — verify employees can't access reports/settings → SO §4 (Employee Restrictions list)
- [ ] Test data isolation audit → SO §11 (all 13 rules):
  - [ ] Verify all tests use `TEST_ORG_ID` — no real org IDs in test code
  - [ ] Verify all tests use `@test.flux.internal` — no real emails in test code
  - [ ] Verify `assertTestOrg()` guard is used in all write test helpers
  - [ ] Verify all cross-org production queries include `WHERE o.is_active = true`
  - [ ] Verify cleanup function covers all tables in correct FK order
  - [ ] Run `npm test` twice consecutively — second run must pass (no state leakage)

### Step 7.5: Security checklist review
> Ref: SO §10 (Code Review Checklist — full list)
> Commit: `docs(infra): complete security checklist review and mark steps done`
> Files: `docs/implementation-plan.md` (mark steps ✅ DONE)

- [ ] All new API routes have auth middleware → SO §10
- [ ] All inputs validated with Zod → SO §10
- [ ] All SQL parameterized → SO §10, SO §9 (SQL Safety examples)
- [ ] No `SELECT *` → SO §10
- [ ] No `dangerouslySetInnerHTML` → SO §10
- [ ] Security headers present → SO §1
- [ ] Rate limiting active → SO §6
- [ ] Audit logging complete → SO §5, SO §10
- [ ] Generic error messages only → SO §9
- [ ] No hardcoded secrets → SO §8, SO §10
- [ ] `git diff` reviewed — no secrets leaked → SO §10

---

## Phase 8 — Deployment

### Step 8.1: Azure App Service provisioning
> Ref: BP §2 (Azure Infrastructure — Resources Required), BP §9 (Security — Network-Level Restrictions), SO §7 (Network Security)
> Commit: `chore(infra): provision Azure App Service for management portal`
> Files: Azure portal configuration (no code files)
> Phase Strategy: **Blocked** — needs Azure subscription/resource group from Brandon

- [ ] Create Azure App Service for management portal → BP §2 (App Service #2)
- [ ] Configure environment variables from Key Vault → BP §2 (Environment Variables), SO §8 (Secrets Management)
- [ ] Configure custom domain (`management.fluxtech.com`) → BP §2
- [ ] Enable HTTPS
- [ ] Configure IP whitelist (recommended) → SO §7 (Azure App Service Level)

### Step 8.2: Azure AD app registration
> Ref: BP §3 (Auth — Azure AD Setup: app name, redirect URI, permissions list)
> Commit: `chore(infra): register management portal in Azure AD with API permissions`
> Files: Azure portal configuration, `.env.local` (update client ID)
> Phase Strategy: **Blocked** — needs admin consent for `Tasks.ReadWrite.All` from Brandon

- [ ] Register `flux-management-portal` in Azure AD → BP §3 (Azure AD Setup)
- [ ] Configure redirect URIs → BP §3 (Redirect URI)
- [ ] Request admin consent for API permissions → BP §3 (API Permissions list: User.Read, Tasks.ReadWrite.All, Sites.Read.All, Mail.Send, Group.Read.All)
- [ ] Verify `Tasks.ReadWrite.All` is granted → EA §Microsoft Graph API (Planner write requires this)

### Step 8.3: Run migrations on production database
> Ref: BP §4 (Database Schema — Migration files)
> Commit: `chore(db): run management table migrations on production database`
> Files: no code changes — migration run on production DB
> Phase Strategy: **Blocked** — needs production database access

- [ ] Run `005_management_tables.sql` on production PostgreSQL → BP §4 (7 new tables)
- [ ] Run `006_extend_user_roles.sql` on production PostgreSQL → BP §4 (extend role enum)
- [ ] Verify tables created correctly
- [ ] Verify existing client portal tables are unaffected

### Step 8.4: Seed production data
> Ref: BP §1 (Architecture — Target Users table), BP §4 (Schema — `client_profiles`, `team_members`)
> Commit: `chore(db): seed production management users and client profiles`
> Files: no code changes — seed run on production DB
> Phase Strategy: **Blocked** — needs production database access

- [ ] Add management users (Brandon Devier, Zack Devier, Brandon Herring) → BP §1 (Target Users)
- [ ] Create `client_profiles` for existing organizations → BP §4 (table 1)
- [ ] Create `team_members` entries → BP §4 (table 2)

### Step 8.5: CI/CD pipeline
> Ref: BP §2 (Azure Infrastructure)
> Commit: `ci(infra): add CI/CD pipeline for build, test, and deploy`
> Files: `.github/workflows/deploy.yml` (or Azure DevOps pipeline)
> Phase Strategy: **Blocked** — needs Azure infrastructure from Steps 8.1-8.2

- [ ] Configure GitHub Actions or Azure DevOps
- [ ] Build → Test → Deploy on push to `main`
- [ ] Environment-specific configuration

### Step 8.6: Post-deployment verification + merge
> Ref: BP §3 (Auth Flow), BP §6 (Integration Details), BP §7 (AI Assistant), BP §8 (Notifications)
> Commit: `docs(infra): post-deployment verification complete, merge to main`
> Files: `docs/implementation-plan.md` (final ✅ DONE markings)
> Phase Strategy: **Blocked** — requires all Phase 8 steps complete

- [ ] Verify Azure AD login works → BP §3 (Auth Flow steps 1-8)
- [ ] Verify cross-org data access → SO §2 (Data Access Model)
- [ ] Verify task write-back to Planner → BP §6 (Task Write-Back), EA §Planner Write-Back
- [ ] Verify email notifications → BP §8 (Notification System), EA §Outlook Mail
- [ ] Verify AI assistant with real data → BP §7 (AI Assistant — cross-org context)
- [ ] Run security checklist → SO §10 (Code Review Checklist)
- [ ] Merge `feat/backend-implementation` → `main`

---

## Progress Summary

| Phase | Steps | Done | Status |
|-------|-------|------|--------|
| 0. Pre-Implementation Setup | 6 | 6 | ✅ Complete |
| 1. Database Foundation | 6 | 6 | ✅ Complete |
| 2. Authentication | 6 | 6 | ✅ Complete (code done, Azure AD testing pending) |
| 3. Database Query Modules | 11 | 11 | ✅ Complete (111 tests, all pass) |
| 4. API Routes | 12 | 0 | ⏳ Not Started |
| 5. Integrations | 4 | 0 | ⏳ Not Started |
| 6. Frontend Integration | 13 | 0 | ⏳ Not Started |
| 7. Security Hardening | 5 | 0 | ⏳ Not Started |
| 8. Deployment | 6 | 0 | ❌ Blocked (Azure infrastructure) |
| **Total** | **69** | **29** | **42% complete** |
