# Flux Management Portal — Implementation Plan (PRD-Aligned)

> **Single source of truth for implementation progress.**
> **Anchored to:** `PRD (Flux Build).pdf` by Brandon Devier (11/25/2025)
> **Previous plan:** `implementation-plan-old.md` (based on `backend-plan.md` — our internal doc, NOT the PRD)
> **Created:** May 2, 2026
>
> This plan tracks ONLY what Brandon's PRD asked for.
> Features we built that weren't in the PRD are tracked separately in the Scope Creep section.

---

## PRD Reference IDs

Each step references the PRD requirement it fulfills (from `prd-vs-reality-audit.md`):
- **M1-M13** = Management Portal feature requirements (PRD §3.1)
- **W1-W18** = Workflow steps (PRD §3.2)
- **D1-D9** = Data requirements (PRD §4)
- **K1-K5** = KPIs (PRD §4.3)
- **R1-R5** = Reports (PRD §4.3)
- **I1-I6** = Integrations (PRD §5)
- **A1-A11** = AI requirements (PRD §6)
- **U1-U14** = UX requirements (PRD §7)
- **T1-T12** = Technical requirements (PRD §8)
- **AC1-AC9** = Acceptance criteria (PRD §9)

---

## Phase 1 — Infrastructure (Foundation)

### Step 1.1: Project setup ✅ DONE
- [x] Next.js 16 project, dependencies, env template, folder structure
- [x] TypeScript, Tailwind v4, shadcn/ui, Phosphor Icons

### Step 1.2: Database connection ✅ DONE
- [x] PostgreSQL pool (shared with client portal, no RLS)
- [x] Cross-org queries (management users have `organization_id = NULL`)

### Step 1.3: Database migrations ✅ DONE
- [x] Migration 005: 7 management tables
- [x] Migration 006: Extended user role constraint (added `co-ceo`)

### Step 1.4: Test infrastructure ✅ DONE
- [x] Test org (`is_active = false`), test users, seed/cleanup, guards
- [x] Vitest config, 154 tests passing

### Step 1.5: UUID migration ✅ DONE
- [x] Replaced all predictable seed IDs with random UUIDs

---

## Phase 2 — Authentication (PRD §7.1, W1-W3, U1-U4, T4-T5, AC3)

> PRD: "Secure login via username + password", "SSO using Microsoft accounts", "Role-based access control"

### Step 2.1: Azure AD OAuth2 ✅ DONE
- [x] Azure AD app registration (`flux-management-dev`)
- [x] OAuth2 + PKCE flow, ID token validation
- [x] SSO tested and working
> Fulfills: U1, U4, W3, AC3

### Step 2.2: JWT session management ✅ DONE
- [x] `flux-management-session` cookie (no org ID)
- [x] 24h expiry, HTTP-only, Secure, SameSite=Lax

### Step 2.3: Auth middleware ✅ DONE
- [x] `withManagementAuth` — verifies JWT, looks up user, rejects `client` role
- [x] `withRole` — restricts sensitive routes to co-ceo/director
- [x] Rate limiting on all routes
> Fulfills: U2, W7, T4

### Step 2.4: Auth API routes ✅ DONE
- [x] Login, callback, logout, me, dev-login
- [x] Security headers (HSTS, X-Frame-Options, CSP, etc.)

### Step 2.5: Route protection ✅ DONE
- [x] Next.js middleware redirects unauthenticated users to `/login`
- [x] Login page wired to Azure AD SSO

### Step 2.6: MFA ⚠️ PARTIAL
- [x] Azure AD supports MFA natively
- [ ] MFA not enforced via Conditional Access policy (needs Brandon to configure in Azure)
> Fulfills: U3, T5 — partially

---

## Phase 3 — Atera Integration: IT Help Desk Tickets (PRD §3.1 M3, M7-M9, K1-K2)

> PRD MUST-HAVE: "Seamless integration with Atera to provide real-time IT Help Desk ticket data for each client"

### Step 3.1: Ticket data from Atera ✅ DONE
- [x] Client portal syncs Atera every 5 min → writes to shared `tickets` table
- [x] Management portal reads from shared DB (no direct Atera calls)
- [x] 1,794 tickets synced across all clients
> Fulfills: M3, M7, D1, D6, I1, A1, AC2

### Step 3.2: Ticket query module ✅ DONE
- [x] `listTickets()` — cross-org, paginated, filterable by status/priority/client/assignee
- [x] `getTicket()` — detail with activities, attachments, internal notes
- [x] `getTicketStats()` — open/pending/closed/critical counts, avg resolution
- [x] All queries include `WHERE o.is_active = true`
> Fulfills: M8 (status)

### Step 3.3: Tickets page ✅ DONE
- [x] Table with ticket #, subject, client, status, priority, assigned to, updated
- [x] Filters: status, priority, search
- [x] Pagination (10 per page)
- [x] Click row → ticket slide-over with full detail
- [x] HTML description stripping for Atera email thread content

### Step 3.4: Ticket status display on dashboard ✅ DONE
- [x] Open tickets count, critical count, pending count
- [x] Average resolution time (154h)
> Fulfills: K1, K2

### Step 3.5: 30-day ticket trends ✅ DONE
- [x] Chart data endpoint: `GET /api/tickets/chart-data?range=30d`
- [x] Returns daily created/resolved counts via `generate_series`
- [x] Wired to dashboard chart with 30-day toggle
> Fulfills: M8

### Step 3.6: 7-day ticket activity chart ✅ DONE
- [x] Chart data endpoint: `GET /api/tickets/chart-data?range=7d`
- [x] Hook: `useTicketChartData(range)`
- [x] Recharts BarChart on dashboard: created (red) vs resolved (green) bars
- [x] Range toggle: 7 Days / 30 Days / 90 Days
- [x] Real data from database with `is_active=true` filter
> Fulfills: M9

---

## Phase 4 — Project Management Integration (PRD §3.1 M4, M10, W10-W14, K3)

> PRD MUST-HAVE: "Project updates and timeline tracking, ensuring clients and management have up-to-date visibility on ongoing work"

### Step 4.1: Project data from Planner ✅ DONE
- [x] Client portal syncs Planner every 15 min → writes to shared `projects`/`project_tasks` tables
- [x] Management portal reads from shared DB
- [x] 5 projects synced locally (13 on production)
> Fulfills: M4, M10, D2, D7, I2, AC2

### Step 4.2: Project query module ✅ DONE
- [x] `listProjects()` — cross-org, filterable, paginated
- [x] `getProject()` — detail with tasks and assignees
- [x] `getProjectStats()` — on-track/at-risk/delayed counts, avg progress
- [x] Task CRUD: `createTask()`, `updateTask()`, `deleteTask()`
> Fulfills: W11, W12, K3

### Step 4.3: Projects page ✅ DONE
- [x] 3 view modes: Cards, List, Timeline (Gantt)
- [x] KPI cards: Active Projects, Tasks Completed, On Track %
- [x] Click project → detail page with tasks
> Fulfills: M4

### Step 4.4: Task CRUD for employees ✅ DONE
- [x] Create/update/delete tasks via API
- [x] Employee: own tasks only. Co-CEO/Director: any task.
- [x] Planner write-back built (background, non-blocking)
- [ ] Planner write-back not tested in production (needs M365 Group IDs from Brandon)
> Fulfills: W10-W14

### Step 4.5: Project completion percentage ✅ DONE
- [x] Progress bars on project cards and detail
- [x] Tasks completed / total tasks ratio
- [x] "60% On Track" KPI on projects page
> Fulfills: K3, U9

---

## Phase 5 — Tech Stack Information (PRD §3.1 M5, K5)

> PRD SHOULD-HAVE: "Display of detailed tech stack information for each client"

### Step 5.1: Tech stack query module ✅ DONE
- [x] `listSoftwareSubscriptions(clientId?)`, `listInfrastructureItems(clientId?)`, `listCloudServices(clientId?)`
- [x] `getTechStackStats()` — summary counts
- [x] All queries include `WHERE o.is_active = true`
> Fulfills: M5, K5

### Step 5.2: Tech stack page ✅ DONE
- [x] New page at `/tech-stack` with sidebar nav link (StackIcon)
- [x] 3 KPI cards: Software, Infrastructure, Cloud counts
- [x] 3 data tables with per-client breakdown, status badges, empty states
- [x] API: `GET /api/tech-stack?clientId=`
- [x] Hook: `useTechStack(clientId?)`
> Fulfills: M5, K5, D3

### Step 5.3: Tech stack health indicators ⚠️ PARTIAL
- [x] Stats endpoint returns expiring/offline counts
- [ ] Not yet surfaced as KPI on dashboard
> Fulfills: K5 — partially

---

## Phase 6 — Dashboard (PRD §3.2 W4-W5, U8-U9, AC4, AC7)

> PRD: "Dashboard displays IT health, project timelines, and operational metrics"

### Step 6.1: Dashboard with cross-org data ✅ DONE
- [x] Combined KPI endpoint: ticket stats, project stats, team count
- [x] Real data from database (not mock)
- [x] Greeting uses real user name from auth
> Fulfills: W4, W5, R3, AC4

### Step 6.2: Dashboard KPI panels ✅ DONE
- [x] Open tickets + critical/pending breakdown
- [x] Active projects + at-risk/delayed count
- [x] Average resolution time
> Fulfills: U8, U9, K1, K2, K3

### Step 6.3: Recent tickets table ✅ DONE
- [x] 5 most recent tickets with ticket #, subject, client, status, priority

### Step 6.4: Active projects carousel ✅ DONE
- [x] Scrollable project cards with progress bars

### Step 6.5: Ticket activity chart ✅ DONE
- [x] Wired `getTicketChartData()` to Recharts BarChart on dashboard
- [x] Created (red) vs Resolved (green) bars per day
- [x] 7d/30d/90d range toggle
- [x] Real data from API with `is_active=true` filter
> Fulfills: M9, U8

### Step 6.6: Remove fake sparkline charts ✅ DONE
- [x] Removed all 3 hardcoded sparkline data arrays
- [x] Removed AreaChart components from all 3 KPI panels
- [x] No more fake trend data on dashboard

### Step 6.7: Remove/relabel non-PRD metrics from dashboard ✅ DONE
- [x] Revenue panel ($70K) → replaced with "Clients" panel (count + total tickets)
- [x] Utilization (80%) → removed from projects panel
- [x] Dashboard now shows only PRD-aligned data: clients, tickets, projects

---

## Phase 7 — Client Data & Drill-Down (PRD §3.1 M12, D3, D5)

> PRD: "Dynamic data exploration, allowing management to drill down into client information"

### Step 7.1: Client list page ✅ DONE
- [x] Shows all active clients (Armada, OnPoint)
- [x] Excludes Flux Technologies (not a client)
- [x] Filters: search, industry, health, contract
- [x] Click row → client detail
> Fulfills: M12

### Step 7.2: Client detail page ✅ DONE
- [x] Overview tab with KPIs, recent tickets, active projects
- [x] Tickets tab with full table
- [x] Projects tab with cards
- [x] Contacts tab
> Fulfills: M12

### Step 7.3: Client data entry (Wisetrack replacement) ❌ NOT DONE
- [ ] PRD §4.1: "Client information (company name, contact details, tech stack)" from Wisetrack CRM
- [ ] PRD says "This can be a manual process" (I3)
- [ ] Need editable client profile form: company name, contacts, industry
- [ ] Currently client profile data was seeded — no way for managers to edit it
- [ ] The `PUT /api/clients/:id` endpoint exists but no frontend edit form is wired
> Fulfills: D3, D5, I3

---

## Phase 8 — AI Assistant (PRD §3.1 M6, M11, §6, W15-W18, A8-A11)

> PRD NICE-TO-HAVE: "An AI-powered assistant that can answer operational questions leveraging the data within the system"

### Step 8.1: Claude AI integration ✅ DONE
- [x] Anthropic SDK client (claude-sonnet-4-20250514)
- [x] Cross-org context builder (tickets, projects, team, clients)
- [x] Management persona system prompt
- [x] "Verify critical information" disclaimer
> Fulfills: M6, M11, A8, A10, W15-W18

### Step 8.2: AI chat interface ✅ DONE
- [x] Chat page with message history
- [x] Suggested queries
- [x] Conversation persistence in database
- [x] Send via Enter, Shift+Enter for newline
> Fulfills: M6, AC5

### Step 8.3: AI context includes real data ✅ DONE
- [x] Context builder queries all active org data
- [x] `is_active=true` filter excludes test org
- [x] No secrets/credentials in prompt
> Fulfills: A10 (100% accurate data-driven answers)

---

## Phase 9 — Notifications (PRD §7.3, U10-U14, I4-I5)

> PRD: "Management: When critical IT issues occur. Weekly summary reports."

### Step 9.1: In-app notifications ✅ DONE
- [x] `management_notifications` table with 6 types
- [x] API: list, unread-count, mark-read
- [x] Bell icon with unread badge in top bar
- [x] Notification dropdown
> Fulfills: U14

### Step 9.2: Email notifications ✅ DONE
- [x] Graph API Mail.Send integration
- [x] Templates: ticket escalation, contact form alert, task assignment
- [x] Fire-and-forget (non-blocking)
> Fulfills: U13, I4

### Step 9.3: Contact form webhook ✅ DONE
- [x] `POST /api/contact-submissions/webhook` with X-API-Secret auth
- [x] Stores raw submission in database
- [ ] Notification creation on submission not wired (TODO in code)
- [ ] flux-app contact form not yet configured to call this endpoint
> Fulfills: I5, D4, D9, R4 — partially

### Step 9.4: Weekly summary reports ❌ NOT DONE
- [ ] PRD asks for "Weekly summary reports" for management (U11)
- [ ] PRD §6: "Report generation (weekly/monthly summaries for management)" (A4)
- [ ] Need scheduled job that generates and emails a weekly digest
> Fulfills: U11, A4, R5

### Step 9.5: Critical issue notifications ⚠️ PARTIAL
- [ ] PRD asks for notifications "When critical IT issues occur" (U10)
- [ ] Email template exists but trigger logic not implemented
- [ ] Need: when a ticket is synced with priority="Critical", create notification + send email
> Fulfills: U10

---

## Phase 10 — Reporting (PRD §4.3 R1-R5, AC7)

> PRD: "Client-level IT Help Desk activity reports", "Project progress and timeline reports", "Management dashboard with company-wide metrics"

### Step 10.1: Management dashboard ✅ DONE
- [x] Company-wide ticket stats, project stats
- [x] Cross-org data from all clients
> Fulfills: R3, AC7

### Step 10.2: Client-level ticket activity reports ⚠️ PARTIAL
- [x] Client detail page shows that client's tickets
- [x] `getClientStats()` returns per-client ticket metrics
- [ ] No formal "report" view — just raw data on client detail page
- [ ] PRD asks for "Client-level IT Help Desk activity reports" (R1) — needs a downloadable/printable format
> Fulfills: R1 — partially

### Step 10.3: Project progress reports ✅ DONE
- [x] Projects page with timeline view, progress bars, task counts
- [x] Per-project detail with Gantt chart
> Fulfills: R2

### Step 10.4: Contact form submission summary ✅ DONE
- [x] Contact submissions page with list, status filter, update status
> Fulfills: R4

### Step 10.5: Weekly/monthly management summaries ❌ NOT DONE
- [ ] Same as Step 9.4 — scheduled report generation
> Fulfills: R5

---

## Phase 11 — Employee Access (PRD §2.2, W10-W14)

> PRD: "Lower-Level Employees: Just access to project management system and only enough access to create, delete, or complete a task"

### Step 11.1: Employee role restrictions ✅ DONE
- [x] Employees can access: dashboard (limited), tickets, projects, settings
- [x] Employees blocked from: reports, AI, contact submissions, team edit, client edit
- [x] Task CRUD: employees can create/update/delete their own tasks only
> Fulfills: PRD §2.2 employee permissions

---

## Phase 12 — Security & Compliance (PRD §8.2, T4-T7, AC9)

### Step 12.1: Role-based access control ✅ DONE
- [x] Co-CEO: full access
- [x] Director: full access
- [x] Employee: limited (projects + tasks only)
- [x] Client: blocked from management portal
> Fulfills: T4, U2

### Step 12.2: Audit logging ✅ DONE
- [x] `activity_log` table
- [x] All 7 mutation endpoints log actions
- [x] Read-only operations do not log
> Fulfills: T6, AC9

### Step 12.3: Security hardening ✅ DONE
- [x] Parameterized SQL, no SELECT *, Zod validation
- [x] Security headers (HSTS, X-Frame-Options, CSP)
- [x] Rate limiting (5 tiers)
- [x] Generic error messages only
- [x] 404 page, error boundary
> Fulfills: T4, AC9

### Step 12.4: Data encryption ⚠️ PARTIAL
- [x] TLS in transit (Azure PostgreSQL requires SSL)
- [x] Azure encrypts at rest by default
- [ ] No application-level encryption
> Fulfills: PRD §4.2 compliance — partially

---

## Phase 13 — Performance (PRD §8.1, T1-T3)

### Step 13.1: Dashboard load time ✅ DONE
- [x] Dashboard loads in ~2 seconds locally
- [x] React Query with 60s stale time
> Fulfills: T1 (< 5 seconds)

### Step 13.2: AI response time ✅ DONE
- [x] Claude responds in ~3-5 seconds for simple queries
> Fulfills: T2 (< 10 seconds)

### Step 13.3: Data sync ✅ DONE
- [x] Atera: every 5 min
- [x] Planner: every 15 min
> Fulfills: T3 (near real-time)

---

## Phase 14 — Deployment

### Step 14.1: Azure AD app registration ✅ DONE
- [x] `flux-management-dev` registered, admin consent granted
- [x] SSO working on localhost

### Step 14.2: Deploy to Vercel ❌ NOT DONE
- [ ] Create Vercel project, link repo
- [ ] Configure env vars
- [ ] Set production redirect URI in Azure AD

### Step 14.3: Run migrations on production ❌ NOT DONE
- [ ] Run 005 + 006 on production PostgreSQL
- [ ] Verify client portal unaffected

### Step 14.4: Seed production data ❌ NOT DONE
- [ ] Team members, client profiles (from Wisetrack or manual entry)

### Step 14.5: Post-deployment verification ❌ NOT DONE
- [ ] SSO login on production
- [ ] Cross-org data loads
- [ ] AI assistant works with real data
- [ ] Notifications trigger
> Fulfills: AC1-AC9

---

## Phase 15 — Scope Creep Items (NOT in PRD — Decision Required)

These features were built but are NOT traceable to any PRD requirement. They need a decision: **keep, modify, or remove**.

| Feature | Current State | Risk | Recommendation |
|---|---|---|---|
| Revenue tracking ($70K) | Seeded data shown as real metric | HIGH — fake data | Remove from dashboard OR add "Manually entered" label + edit form |
| SLA compliance (59%, 54%) | Computed from ticket data | HIGH — unvalidated metric | Remove OR discuss with Brandon |
| Health scores (Healthy/At Risk/Critical) | Seeded, not computed | MEDIUM | Keep if Brandon wants manual health tracking, add edit form |
| Utilization (80%) | Default seed value | HIGH — meaningless number | Change label to "Target" or remove |
| Revenue Report page | Full report with charts | HIGH — based on seeded data | Remove or label as "Beta" |
| SLA Compliance Report page | Report with gauges | HIGH — unvalidated | Remove or label |
| Team Performance Report page | Productivity charts | MEDIUM — real ticket data | Keep but rename, remove utilization |
| Ticket Analytics Report page | Priority breakdown | LOW — uses real data | Keep — this is basically R1 from PRD |
| Sparkline charts on dashboard | Hardcoded static arrays | HIGH — fake trends | Remove |
| Internal notes on tickets | Management-only notes | LOW — useful | Keep |
| Connectors page | Sync health monitoring | LOW — useful | Keep |
| Client profiles (industry, contract) | Seeded data | LOW | Keep — aligns with D3/D5, add edit form |
| Report snapshots table | Infrastructure for trends | LOW | Keep — not user-facing |
| Activity log / audit trail | All mutations logged | LOW — good practice | Keep — required by T6 |

---

## Progress Summary

> **Last updated:** May 2, 2026

### PRD Requirements Status

| Category | Total | ✅ Done | ❌ Missing | ⚠️ Partial |
|---|---|---|---|---|
| Must-have features (M3, M4) | 2 | 2 | 0 | 0 |
| Should-have features (M5) | 1 | 0 | 1 | 0 |
| Nice-to-have features (M6) | 1 | 1 | 0 | 0 |
| Data inputs (M7-M10, M13) | 5 | 5 | 0 | 0 |
| Data outputs (M11-M12) | 2 | 2 | 0 | 0 |
| Charts & trends (M8-M9) | 2 | 0 | 1 | 1 |
| KPIs (K1-K5) | 5 | 3 | 2 | 0 |
| Reports (R1-R5) | 5 | 3 | 1 | 1 |
| Integrations (I1-I6) | 6 | 3 | 2 | 1 |
| AI (A1-A11) | 11 | 5 | 3 | 3 |
| UX (U1-U14) | 14 | 11 | 2 | 1 |
| Technical (T1-T12) | 12 | 9 | 0 | 3 |
| Acceptance (AC1-AC9) | 9 | 7 | 0 | 2 |

### What Must Be Fixed Before Showing to Brandon

| # | Item | PRD Ref | Effort |
|---|---|---|---|
| 1 | Build 7-day ticket activity chart (wire existing query to Recharts) | M9 | 4-6h |
| 2 | Remove or label fake sparkline charts | — | 30min |
| 3 | Remove or label revenue/SLA/utilization on dashboard | — | 2h |
| 4 | Add tech stack page (read from existing shared tables) | M5 | 4-6h |
| 5 | Wire 30-day ticket trends to dashboard | M8 | 2-3h |

### What Should Be Done Before Launch

| # | Item | PRD Ref | Effort |
|---|---|---|---|
| 6 | Client data edit form (contacts, details) | D3, I3 | 4-6h |
| 7 | Contact form notification trigger | I5 | 2h |
| 8 | Critical ticket notification trigger | U10 | 3h |
| 9 | Deploy to Vercel | — | 1h |
| 10 | Run production migrations + seed | — | 1h |

### What Can Wait (Post-Launch)

| # | Item | PRD Ref | Effort |
|---|---|---|---|
| 11 | Weekly summary email reports | R5, U11, A4 | 6-8h |
| 12 | OneDrive document integration | I6 | 4-6h |
| 13 | Wisetrack CRM integration (if not manual) | I3 | TBD |
| 14 | AI predictive insights (trends, resource allocation) | A5-A7 | Future |
| 15 | MFA enforcement via Conditional Access | T5 | Brandon config |
