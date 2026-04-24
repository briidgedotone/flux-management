# Flux Management Portal — Backend Implementation Plan

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Azure Infrastructure](#2-azure-infrastructure)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [Integration Details](#6-integration-details)
7. [AI Assistant Architecture](#7-ai-assistant-architecture)
8. [Notification System](#8-notification-system)
9. [Security & Compliance](#9-security--compliance)
10. [Test Strategy](#10-test-strategy)
11. [Implementation Phases](#11-implementation-phases)
12. [Folder Structure](#12-folder-structure)
13. [Common vs Different — Client Portal Comparison](#13-common-vs-different--client-portal-comparison)

---

## 1. Architecture Overview

### System Context

The Management Portal is an internal dashboard for Flux Technologies leadership and employees to manage operations, track performance, and oversee client health across all client organizations.

```
Browser → Management Portal (Azure App Service #2)
              ↓
         Same PostgreSQL DB ← Client Portal (Azure App Service #1)
              ↑
         Azure Functions (existing sync jobs — Atera, Planner, SharePoint)
              ↑
         Atera API / Graph API / Claude API
```

### Core Principles

- **Shared database** — Same PostgreSQL instance as client portal. Management-specific tables added via new migrations. No data duplication.
- **Separate deployment** — Own Azure App Service at `management.fluxtech.com` (or similar). Can be IP-restricted for internal access only.
- **Separate Azure AD app registration** — Only Flux employees see/access it. Same `users` table, management roles (`co-ceo`, `director`, `employee`).
- **Cross-org access** — Management users have `organization_id = NULL` in the users table. They can query across all orgs. No RLS filtering for management roles.
- **Dual-write for tasks** — Write to PostgreSQL immediately + push to Planner via Graph API in background. If Planner write fails, DB is still correct, next sync reconciles.
- **Read-only for everything else** — Tickets, documents, tech stack are read from the shared DB (populated by existing sync jobs).
- **Manual client profiles** — Revenue, contracts, health scores entered by managers.
- **Hybrid team metrics** — Ticket/task counts computed on-the-fly from real data. Capacity and utilization targets manually managed.

### Data Flow

```
Existing (no changes):
  Atera API → Azure Functions (every 5 min) → tickets, infrastructure_items
  Graph API → Azure Functions (every 15 min) → projects, project_tasks
  SharePoint → Azure Functions (every 30 min) → documents, software_subscriptions, cloud_services

New for Management Portal:
  Manager creates/updates task → PostgreSQL (immediate) + Planner (background)
  Manager updates client profile → PostgreSQL (client_profiles table)
  Manager adds internal note → PostgreSQL (internal_notes table)
  Nightly snapshot job → PostgreSQL (report_snapshots table)
  Website contact form → POST /api/contact-submissions/webhook → PostgreSQL
```

### Target Users

| Role | Count | Access Level |
|------|-------|-------------|
| Co-CEO | 2 (Brandon Devier, Zack Devier) | Full access to everything |
| Director | 1 (Brandon Herring) | Full access except settings/team deletion |
| Employee | ~5 (growing) | Read-only + own tasks |

---

## 2. Azure Infrastructure

### Resources Required

| Resource | Type | Purpose |
|----------|------|---------|
| App Service #2 | Azure App Service (B1) | Management Portal hosting |
| PostgreSQL | Azure PostgreSQL Flexible Server | **Shared** — same instance as client portal |
| Azure AD App | App Registration | `flux-management-dev` (separate from client portal) |
| Key Vault | Azure Key Vault | **Shared** — same vault, management-specific secrets added |
| Azure Functions | Azure Functions App | **Shared** — existing sync jobs + 1 new nightly snapshot job |

### Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://management.fluxtech.com
NODE_ENV=production

# Azure AD (Management App Registration)
AZURE_AD_TENANT_ID=<same-tenant>
AZURE_AD_CLIENT_ID=<management-app-client-id>
AZURE_AD_CLIENT_SECRET=<management-app-client-secret>
AZURE_AD_REDIRECT_URI=https://management.fluxtech.com/api/auth/callback

# Database (same as client portal)
DATABASE_URL=postgresql://...@flux-postgres.postgres.database.azure.com:5432/fluxdb

# Integrations (same keys as client portal)
ATERA_API_KEY=<same>
ANTHROPIC_API_KEY=<same>

# Management-specific
JWT_SECRET=<management-specific-secret>
CONTACT_WEBHOOK_SECRET=<shared-secret-for-flux-app>
REPORT_SNAPSHOT_CRON=0 2 * * *

# Azure Key Vault
AZURE_KEY_VAULT_URL=<same-vault>
```

### Network Security (Recommended)

- IP whitelist at Azure App Service level (office IPs + VPN)
- Azure AD Conditional Access policy requiring MFA for management app
- Separate subdomain with no public discoverability
- No cross-origin access from client portal domain

---

## 3. Authentication & Authorization

### Azure AD Setup

- **New app registration:** `flux-management-dev`
- **Same Azure AD tenant** as client portal
- **Redirect URI:** `https://management.fluxtech.com/api/auth/callback`
- **API Permissions (Application):**
  - `User.Read` — Read user profile
  - `Tasks.ReadWrite.All` — Create/update/delete Planner tasks
  - `Sites.Read.All` — Read SharePoint (for context)
  - `Mail.Send` — Send notification emails
  - `Group.Read.All` — Read M365 Groups for Planner

### Auth Flow

Same pattern as client portal (Azure AD OAuth2 + PKCE):

1. User clicks "Sign in with Microsoft SSO" on `/login`
2. Redirects to `GET /api/auth/login` → Azure AD authorization URL
3. Azure AD redirects back to `GET /api/auth/callback?code=...&state=...`
4. Backend exchanges code for tokens (with PKCE), validates ID token & nonce
5. Looks up user by Azure AD OID in `users` table
6. Verifies user has management role (`co-ceo`, `director`, or `employee`)
7. Creates JWT, stores in `flux-management-session` HTTP-only cookie
8. Redirects to `/dashboard`

### JWT Payload

```typescript
{
  userId: string;        // UUID
  email: string;
  name: string;
  role: "co-ceo" | "director" | "employee";
  // NO organizationId — management users are cross-org
  iat: number;
  exp: number;           // 24h
}
```

### Cookie Configuration

```typescript
{
  name: "flux-management-session",  // Different from client portal's "flux-session"
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 86400  // 24h
}
```

### Roles & Permissions Matrix

| Permission | Co-CEO | Director | Employee |
|------------|--------|----------|----------|
| Dashboard (full) | Yes | Yes | Limited (no revenue) |
| View all clients | Yes | Yes | Yes |
| Edit client profiles | Yes | Yes | No |
| View all tickets | Yes | Yes | Yes |
| Add internal notes | Yes | Yes | Yes |
| View all projects | Yes | Yes | Yes |
| Create tasks | Yes | Yes | Yes |
| Update any task | Yes | Yes | No (own tasks only) |
| Delete tasks | Yes (any) | Yes (any) | Yes (own only) |
| View team | Yes | Yes | Own stats only |
| Edit team members | Yes | Yes | No |
| View reports | Yes | Yes | No |
| AI assistant (cross-org) | Yes | Yes | No (own context) |
| Settings (full) | Yes | Limited | Own profile only |
| Contact submissions | Yes | Yes | No |

### Middleware

**`withManagementAuth(request, handler)`**
```typescript
// 1. Extract JWT from flux-management-session cookie
// 2. Verify signature and expiry
// 3. Look up user in users table
// 4. Confirm role is co-ceo, director, or employee
// 5. Pass { user, role } to handler
```

**`withRole(request, allowedRoles, handler)`**
```typescript
// Wraps withManagementAuth
// Additionally checks if user.role is in allowedRoles[]
// Returns 403 if not authorized
```

### Key Difference from Client Portal

| Aspect | Client Portal | Management Portal |
|--------|---------------|-------------------|
| JWT contains `organizationId` | Yes | No |
| Queries scoped by org from JWT | Yes | No — org comes from URL param or aggregates all |
| RLS enforcement | Yes (3 layers) | No — middleware only |
| Cookie name | `flux-session` | `flux-management-session` |

---

## 4. Database Schema

### Shared Tables (Already Exist — Client Portal)

These 17 tables are already in the database. The management portal reads from them directly:

1. `organizations` — Client companies
2. `users` — All users (clients + management)
3. `tickets` — IT helpdesk tickets (from Atera)
4. `ticket_activities` — Ticket event timeline
5. `ticket_attachments` — Files on tickets
6. `projects` — Client projects (from Planner)
7. `project_tasks` — Tasks within projects
8. `project_assignees` — People assigned to projects
9. `documents` — Files (from SharePoint)
10. `software_subscriptions` — Software licenses
11. `infrastructure_items` — Devices and hardware
12. `cloud_services` — Cloud service subscriptions
13. `ai_conversations` — AI chat sessions
14. `ai_messages` — Individual chat messages
15. `notifications` — Client portal notifications
16. `connector_statuses` — Integration health
17. `sync_logs` — Sync job audit trail

### New Tables (7) — Management-Specific

#### Migration: `005_management_tables.sql`

**1. `client_profiles`** — Business data about each client org

```sql
CREATE TABLE IF NOT EXISTS client_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       UUID NOT NULL UNIQUE REFERENCES organizations(id),
    industry              TEXT,
    monthly_revenue       NUMERIC(10,2),
    contract_status       TEXT CHECK (contract_status IN ('active', 'expiring', 'expired')),
    contract_start_date   DATE,
    contract_end_date     DATE,
    health_score          TEXT CHECK (health_score IN ('healthy', 'at-risk', 'critical')),
    sla_target            INTEGER DEFAULT 95 CHECK (sla_target BETWEEN 0 AND 100),
    primary_contact_name  TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_org ON client_profiles(organization_id);
```

**2. `team_members`** — Management-specific team data extending `users`

```sql
CREATE TABLE IF NOT EXISTS team_members (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES users(id),
    capacity_hours_week   INTEGER DEFAULT 40,
    utilization_target    INTEGER DEFAULT 80 CHECK (utilization_target BETWEEN 0 AND 100),
    status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
    department            TEXT,
    hire_date             DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
```

**3. `internal_notes`** — Management-only notes on tickets

```sql
CREATE TABLE IF NOT EXISTS internal_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_notes_ticket ON internal_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_author ON internal_notes(author_id);
```

**4. `activity_log`** — Audit trail of management actions

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    action          TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'viewed')),
    entity_type     TEXT NOT NULL CHECK (entity_type IN ('ticket', 'project', 'client', 'document', 'note', 'task', 'team_member', 'contact_submission')),
    entity_id       UUID,
    organization_id UUID REFERENCES organizations(id),
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id, created_at DESC);
```

**5. `report_snapshots`** — Pre-computed report data for historical trends

```sql
CREATE TABLE IF NOT EXISTS report_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type     TEXT NOT NULL CHECK (report_type IN ('revenue', 'team_performance', 'sla', 'ticket_analytics')),
    period          TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    period_date     DATE NOT NULL,
    data            JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(report_type, period, period_date)
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_type ON report_snapshots(report_type, period_date DESC);
```

**6. `contact_form_submissions`** — Website contact form entries

```sql
CREATE TABLE IF NOT EXISTS contact_form_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    company         TEXT,
    phone           TEXT,
    service_interest TEXT,
    message         TEXT,
    status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded')),
    reviewed_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_form_submissions(status, created_at DESC);
```

**7. `management_notifications`** — Notifications for management users

```sql
CREATE TABLE IF NOT EXISTS management_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL CHECK (type IN ('task_assignment', 'ticket_escalation', 'contact_form', 'health_alert', 'team_update', 'system')),
    title           TEXT NOT NULL,
    description     TEXT,
    link            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mgmt_notifications_user ON management_notifications(user_id, is_read, created_at DESC);
```

#### Migration: `006_extend_user_roles.sql`

```sql
-- Extend user role enum to include management roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client', 'employee', 'director', 'admin', 'co-ceo'));
```

### No RLS on Management Tables

Unlike client portal tables, management tables do **not** use Row-Level Security. All management users can see all management data. Access control is enforced at the API middleware level via `withManagementAuth` and `withRole`.

### Database Connection

The management portal connects to the same PostgreSQL instance but does **not** use `withOrgScope()`:

```typescript
// Client portal pattern (org-scoped):
const result = await withOrgScope(organizationId, async (client) => {
  return client.query('SELECT ... WHERE organization_id = $1', [organizationId]);
});

// Management portal pattern (cross-org):
const result = await pool.query('SELECT ... FROM tickets');  // all orgs
const result = await pool.query('SELECT ... WHERE organization_id = $1', [clientId]);  // specific org from URL param
```

---

## 5. API Routes

### Auth Routes (4 endpoints)

```
POST /api/auth/login           → Initiate Azure AD OAuth2 flow
GET  /api/auth/callback        → OAuth2 callback, create JWT session
GET  /api/auth/logout          → Clear session cookie
GET  /api/auth/me              → Current user info + role
```

### Dashboard (1 endpoint)

```
GET  /api/dashboard            → Combined KPIs
```

Response includes:
- Total monthly revenue (sum of all client_profiles)
- Ticket stats across all clients (open, pending, closed, avg resolution)
- SLA compliance (aggregate)
- Active projects count
- Client health summary (X healthy, Y at-risk, Z critical)
- Team utilization snapshot

### Clients (4 endpoints)

```
GET  /api/clients              → List all clients
                                  Filters: ?industry=&health=&contractStatus=&search=
                                  Joins: organizations + client_profiles + ticket counts + project counts + SLA %

GET  /api/clients/:id          → Client detail
                                  Returns: profile + recent tickets + active projects + contacts

PUT  /api/clients/:id          → Update client profile
                                  Body: { monthlyRevenue, contractStatus, healthScore, notes, ... }
                                  Role: co-ceo, director only
                                  Audit: writes to activity_log

GET  /api/clients/:id/stats    → Client-specific KPIs
                                  Returns: ticket trends, project progress, SLA over time
                                  Filters: ?range=7d|30d|90d
```

### Tickets (4 endpoints)

```
GET  /api/tickets              → All tickets across all clients
                                  Filters: ?status=&priority=&clientId=&assignee=&search=&page=&limit=&sort=

GET  /api/tickets/:id          → Ticket detail
                                  Returns: ticket + activity + attachments + internal notes

POST /api/tickets/:id/notes    → Add internal note
                                  Body: { content }
                                  Role: co-ceo, director, employee
                                  Audit: writes to activity_log

GET  /api/tickets/stats        → Cross-client ticket metrics
                                  Returns: volume, resolution time, trends by period
                                  Filters: ?clientId=&range=7d|30d|90d
```

### Projects (7 endpoints)

```
GET  /api/projects             → All projects across all clients
                                  Filters: ?status=&clientId=&search=

GET  /api/projects/:id         → Project detail
                                  Returns: project + tasks + assignees + tech stack

GET  /api/projects/:id/stats   → Project-specific metrics

GET  /api/projects/stats       → Cross-client project summary

POST /api/projects/:id/tasks   → Create new task
                                  Body: { name, status, priority, assigneeEmail, dueDate }
                                  Writes to: PostgreSQL (immediate) + Planner (background)
                                  Role: co-ceo, director, employee
                                  Audit: writes to activity_log

PUT  /api/projects/:id/tasks/:taskId  → Update task
                                        Body: { status?, assigneeEmail?, dueDate?, name? }
                                        Writes to: PostgreSQL (immediate) + Planner (background)
                                        Role: co-ceo, director, employee (own tasks only)
                                        Audit: writes to activity_log

DELETE /api/projects/:id/tasks/:taskId → Delete task
                                         Deletes from: PostgreSQL + Planner (background)
                                         Role: co-ceo, director (any task), employee (own tasks only)
                                         Audit: writes to activity_log
```

### Team (3 endpoints)

```
GET  /api/team                 → All team members
                                  Returns: user info + computed metrics (tickets resolved, active tasks,
                                  avg resolution time) + manual data (utilization target, capacity)

GET  /api/team/:id             → Individual team member detail
                                  Returns: profile + performance history + current assignments

PUT  /api/team/:id             → Update team member profile
                                  Body: { capacityHoursWeek, utilizationTarget, department, status }
                                  Role: co-ceo, director only
                                  Audit: writes to activity_log
```

### Reports (4 endpoints)

```
GET  /api/reports/revenue          → Revenue breakdown by client, trends, totals
                                     Returns: per-client revenue, total, growth, top client
                                     Filters: ?range=30d|90d|6m|1y
                                     Role: co-ceo, director only

GET  /api/reports/team-performance → Team utilization, productivity, resolution metrics
                                     Returns: per-member stats, averages, trends
                                     Filters: ?range=30d|90d
                                     Role: co-ceo, director only

GET  /api/reports/sla-compliance   → SLA adherence per client, warnings, trends
                                     Returns: per-client SLA %, breaches, trend chart data
                                     Filters: ?range=30d|90d
                                     Role: co-ceo, director only

GET  /api/reports/ticket-analytics → Resolution times, volume trends, priority distribution
                                     Returns: charts data, breakdown by priority/status/client
                                     Filters: ?clientId=&range=30d|90d
                                     Role: co-ceo, director only
```

### AI Assistant (4 endpoints)

```
POST /api/ai/chat              → Send message, get Claude response
                                  Context: cross-org data (all clients, team, revenue)
                                  Rate limit: 20/min per user

GET  /api/ai/conversations     → List user's conversations

GET  /api/ai/conversations/:id → Get conversation messages

DELETE /api/ai/conversations/:id → Delete conversation
```

### Notifications (3 endpoints)

```
GET  /api/notifications        → List notifications for current user
                                  Source: management_notifications table
                                  Filters: ?type=&unread=

GET  /api/notifications/unread-count → Unread badge count

PUT  /api/notifications/mark-read    → Mark one or all as read
                                       Body: { notificationId? } (omit for mark-all)
```

### Contact Submissions (3 endpoints)

```
GET  /api/contact-submissions  → List website contact form submissions
                                  Filters: ?status=new|reviewed|responded
                                  Role: co-ceo, director only

PUT  /api/contact-submissions/:id → Update status
                                     Body: { status: "reviewed" | "responded" }
                                     Role: co-ceo, director only
                                     Audit: writes to activity_log

POST /api/contact-submissions/webhook → Receive from flux-app contact form
                                         Auth: X-API-Secret header (not JWT)
                                         Creates management_notification for co-ceo/director
```

### Settings (2 endpoints)

```
GET  /api/settings/profile     → Current user's profile (name, email, role, phone, notification prefs)

PUT  /api/settings/profile     → Update profile
                                  Body: { name?, phone?, notificationPrefs? }
```

### API Response Format

Same as client portal:

```typescript
// Success
{ data: T }

// Error
{ error: { code: string, message: string } }

// Paginated list
{ data: T[], total: number, page: number, limit: number, totalPages: number }
```

### Route Handler Pattern

```typescript
import { withManagementAuth, withRole } from '@/lib/auth/middleware';
import { successResponse, Errors } from '@/lib/api/response';
import { someSchema } from '@/lib/validators/some';

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    const params = someSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const data = await queryFunction(params);
    return successResponse(data);
  });
}

// Role-restricted route:
export async function PUT(request: NextRequest) {
  return withRole(request, ['co-ceo', 'director'], async (ctx) => {
    const body = updateSchema.parse(await request.json());
    const result = await updateFunction(body);
    await logActivity(ctx.user.id, 'updated', 'client', result.id, body);
    return successResponse(result);
  });
}
```

**Total: 38 endpoints**

---

## 6. Integration Details

### Reused from Client Portal (Zero New Code Needed)

The management portal reads from tables that existing sync jobs populate:

| Data | Source | Sync Frequency | Already Built |
|------|--------|----------------|---------------|
| Tickets | Atera → DB | Every 5 min | Yes |
| Projects & Tasks | Planner → DB | Every 15 min | Yes |
| Documents | SharePoint → DB | Every 30 min | Yes |
| Tech Stack | SharePoint → DB | Every 30 min | Yes |
| Connector Statuses | Health check → DB | Every 10 min | Yes |

### New: Task Write-Back to Planner

When a manager creates or updates a task:

```
Manager action → Write to PostgreSQL (immediate — both portals see it)
              → Push to Planner via Graph API (background, non-blocking)
              → If Planner write fails: log error, task exists in DB
              → Next sync cycle (15 min) reconciles any drift
```

New Graph API operations:
- `POST /planner/tasks` — Create task in a plan
- `PATCH /planner/tasks/{id}` — Update task (status, assignee, due date)
- `DELETE /planner/tasks/{id}` — Delete task

**Requires:** `Tasks.ReadWrite.All` permission (upgrade from client portal's `Tasks.Read.All`)

### New: Contact Form Webhook

The marketing website (`flux-app`) currently submits to Google Sheets. Update it to also POST to the management portal:

```
Website form → POST /api/contact-submissions/webhook
               Auth: X-API-Secret header
               → Insert into contact_form_submissions table
               → Create management_notification for co-ceo/director users
               → (Optional) Send email notification via Outlook
```

### New: Report Snapshot Job

One new Azure Function (nightly at 2 AM):

```
Nightly job → Query tickets, projects, revenue, SLA metrics
            → Aggregate into daily/weekly/monthly snapshots
            → Insert into report_snapshots table
            → Enables historical trend charts without expensive real-time aggregation
```

### Reused: Email Notifications

Same `Mail.Send` via Graph API. Management-specific triggers:
- Critical ticket escalation → email to co-ceo/director
- Contact form submission → email to configured recipients
- Task assignment → email to assigned employee

---

## 7. AI Assistant Architecture

### How It Differs from Client Portal

| Aspect | Client Portal | Management Portal |
|--------|---------------|-------------------|
| Context scope | Single org's data | All orgs' data |
| Persona | "You help this client understand their IT environment" | "You help Flux management analyze operations across all clients" |
| Can compare clients | No | Yes |
| Data in context | Org-scoped tickets, projects, tech stack | All tickets, all projects, all clients, team metrics, revenue |
| Example query | "How many open tickets do I have?" | "Which client has the worst SLA this month?" |

### System Prompt Template

```
You are an AI assistant for Flux Technologies management team.
You have access to real-time operational data across all client organizations.

CURRENT DATA:
- Clients: {client_count} active clients
- Client Details: {client_profiles_summary}
- Tickets: {ticket_summary_across_all_orgs}
- Projects: {project_summary_across_all_orgs}
- Team: {team_metrics_summary}
- Revenue: {total_revenue}, {revenue_by_client}

RULES:
- Answer questions using the data provided above
- You can compare clients against each other
- You can analyze trends and patterns
- For operational decisions (hiring, pricing), provide data-driven analysis but note that final decisions require human judgment
- If data is insufficient, say so — never fabricate numbers
- Format responses with markdown for readability
```

### Context Builder

```typescript
async function buildManagementContext(): Promise<string> {
  const [clients, ticketStats, projectStats, teamMetrics, revenue] = await Promise.all([
    getClientSummaries(),           // All client profiles with health scores
    getTicketStatsAllOrgs(),        // Open/pending/closed counts per org
    getProjectStatsAllOrgs(),       // Active projects, completion rates
    getTeamMetricsSummary(),        // Utilization, tasks, resolution times
    getRevenueSummary(),            // Monthly revenue per client, total
  ]);

  return formatContextString({ clients, ticketStats, projectStats, teamMetrics, revenue });
}
```

### Rate Limiting

- 20 requests per minute per user
- Conversation history stored in `ai_conversations` / `ai_messages` tables (shared with client portal schema)

---

## 8. Notification System

### Management Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| `ticket_escalation` | Critical ticket opened or SLA breach | Co-CEO, Director |
| `task_assignment` | Task assigned to a team member | Assigned employee |
| `contact_form` | New website contact form submission | Co-CEO, Director |
| `health_alert` | Client health score changes to at-risk/critical | Co-CEO, Director |
| `team_update` | Team member status change | Co-CEO, Director |
| `system` | Sync failures, integration errors | Co-CEO, Director |

### Delivery Channels

1. **In-app** — `management_notifications` table, displayed in notification dropdown
2. **Email** — Via Outlook (`Mail.Send` Graph API) for critical/urgent notifications

### Notification Flow

```
Trigger event
  → Insert into management_notifications (for each recipient)
  → If email-worthy: send via Outlook Mail API
  → Frontend polls unread count, displays in bell icon
```

---

## 9. Security & Compliance

### Inherited from Client Portal

The management portal follows the same security rules documented in the client portal's `docs/security-and-operations.md`:

- Parameterized SQL only — never string concatenation
- Zod validation on all API inputs — reject unexpected fields
- Generic error messages — never expose table names, stack traces, or SQL errors
- Security headers — HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy
- Secrets in Azure Key Vault (production) or `.env.local` (dev, gitignored)
- JWT in HTTP-only, Secure, SameSite=Lax cookie
- No `SELECT *` — always specify columns
- No `dangerouslySetInnerHTML`
- No SQL concatenation

### Key Differences from Client Portal

**1. No Row-Level Security**

Client portal uses 3-layer data isolation:
1. API middleware extracts `organizationId` from JWT
2. Query module receives `organizationId` as explicit parameter
3. PostgreSQL RLS policies enforce at database level

Management portal uses **middleware-only access control**:
1. `withManagementAuth` verifies user has management role
2. `withRole` restricts sensitive endpoints to co-ceo/director
3. No RLS — management users can see all orgs' data by design

**2. Audit Logging**

Every write operation logs to `activity_log`:
- Who did it (`user_id`)
- What they did (`action`: created/updated/deleted)
- What entity (`entity_type` + `entity_id`)
- Which client's data (`organization_id`)
- When (`created_at`)

This creates a full audit trail for compliance and accountability.

**3. Network-Level Restrictions**

Since this is an internal tool for 5 users:
- IP whitelist at Azure App Service level
- Optional VPN requirement
- Azure AD Conditional Access with MFA

### Rate Limits

| Route Category | Limit | Rationale |
|----------------|-------|-----------|
| Default | 100 req/min per user | Standard protection |
| Auth | 10 req/min per IP | Brute force prevention |
| AI Chat | 20 req/min per user | API cost control |
| Reports | 30 req/min per user | Heavier aggregation queries |
| Contact webhook | 10 req/min per API key | Spam prevention |

### Code Review Requirements (Same as Client Portal)

- All new API routes must have auth middleware
- All new DB queries must use parameterized SQL
- All mutations must write to activity_log
- No hardcoded secrets, API keys, or credentials
- Review `git diff` before every commit — verify no secrets leaked

---

## 10. Test Strategy

### Overview

The management portal shares a database with the client portal, which contains **real client data** (1,611+ tickets from Atera, real documents from SharePoint, real user accounts). Tests must NEVER corrupt, modify, or pollute this data.

**Solution: A dedicated test organization** within the same database. All test data is scoped to this organization. The existing multi-tenant architecture (`organization_id` on every row) provides natural isolation.

### Test Organization

```sql
-- Permanent fixture — created once, never deleted
INSERT INTO organizations (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000099', 'Flux QA Internal', 'flux-qa-internal', false);
```

**Critical:** `is_active = false` — this makes the test org invisible to all production queries.

### Test Users

```
ID: 00000000-0000-0000-0000-000000000001  |  test-ceo@test.flux.internal       |  co-ceo   |  org_id = NULL
ID: 00000000-0000-0000-0000-000000000002  |  test-director@test.flux.internal   |  director  |  org_id = NULL
ID: 00000000-0000-0000-0000-000000000003  |  test-employee@test.flux.internal   |  employee  |  org_id = NULL
ID: 00000000-0000-0000-0000-000000000004  |  test-client@test.flux.internal     |  client    |  org_id = TEST_ORG
```

All test users use the `@test.flux.internal` email domain — never a real domain.

### Test Seed Data

All scoped to `organization_id = 00000000-0000-0000-0000-000000000099`:

| Table | Count | Notes |
|-------|-------|-------|
| tickets | 20 | Mix of Open/Pending/Closed, all priorities |
| ticket_activities | 40 | 2 per ticket |
| projects | 2 | One "On Track", one "At Risk" |
| project_tasks | 20 | 10 per project, mix of statuses |
| documents | 5 | Mix of file types |
| software_subscriptions | 3 | Active, Expiring Soon, Expired |
| infrastructure_items | 4 | Mix of Online/Offline |
| cloud_services | 2 | Active |
| client_profiles | 1 | Revenue, contract, health for test org |
| team_members | 3 | Linked to test management users |
| internal_notes | 3 | On test tickets, by test management users |
| management_notifications | 5 | Mix of all 6 types |
| contact_form_submissions | 5 | Mix of new/reviewed/responded |
| activity_log | 5 | Sample audit entries |

### Test Infrastructure Files

```
src/__tests__/
├── test-constants.ts          # Well-known UUIDs and email domain
├── seed-test-data.ts          # Creates test org + all test data (idempotent)
├── cleanup.ts                 # Deletes all test data (by org ID + email domain)
├── setup.ts                   # Global: cleanup → seed (runs before all tests)
└── teardown.ts                # Global: cleanup (runs after all tests)
```

### Test Execution Flow

```
npm test
├── 1. Global setup: cleanup (remove leftovers) → seed (fresh test data)
├── 2. All tests run (full CRUD against test org only)
└── 3. Global teardown: cleanup (database identical to before tests)
```

### The `is_active` Filter Rule

**MANDATORY: Every cross-org production query must include `WHERE o.is_active = true`.**

This is the mechanism that keeps test data invisible to real users. It also correctly excludes future churned/inactive clients.

```typescript
// ✅ CORRECT — excludes test org and inactive clients
const clients = await pool.query(
  `SELECT o.name, cp.monthly_revenue
   FROM organizations o
   JOIN client_profiles cp ON o.id = cp.organization_id
   WHERE o.is_active = true`
);

// ❌ WRONG — test org data appears in production results
const clients = await pool.query(
  `SELECT o.name, cp.monthly_revenue
   FROM organizations o
   JOIN client_profiles cp ON o.id = cp.organization_id`
);
```

**Where this filter is required:**
- Dashboard KPIs (total revenue, ticket counts, SLA averages)
- Client list (`GET /api/clients`)
- All 4 report types (revenue, team performance, SLA, ticket analytics)
- Ticket stats (`GET /api/tickets/stats`)
- Project stats (`GET /api/projects/stats`)
- AI context builder (exclude test org from Claude context)

**Where this filter is NOT needed:**
- Single-resource lookups by ID (`GET /api/clients/:id`, `GET /api/tickets/:id`)
- User-scoped queries (`GET /api/notifications`, `GET /api/ai/conversations`)
- Webhook endpoints (`POST /api/contact-submissions/webhook`)

### Test Data Isolation Rules

> Full rules in `docs/security-and-operations.md §11`

1. **NEVER reference a real organization ID in test code** — only `TEST_ORG_ID`
2. **NEVER reference a real user ID in test code** — only `TEST_*_ID` constants
3. **NEVER reference a real email in test code** — only `@test.flux.internal` domain
4. **ALL test INSERTs must use `organization_id = TEST_ORG_ID`** for org-scoped tables
5. **ALL test INSERTs must use test user IDs** for user-scoped tables
6. **ALL test data must be deletable by the cleanup function** — no orphaned rows
7. **Cleanup runs both before and after test suite** — handles crashes/interruptions
8. **Seed data uses `ON CONFLICT DO NOTHING`** — idempotent, safe to run repeatedly
9. **Test org row is permanent** — cleanup deletes test DATA, never the test org itself
10. **Test constants use well-known UUIDs** (`00000000-...`) — immediately recognizable as test data

---

## 11. Implementation Phases

> See `docs/implementation-plan.md` for the step-by-step checklist with progress tracking.

### Phase Summary

| Phase | Description | Steps |
|-------|-------------|-------|
| 0 | Pre-Implementation Setup | 5 |
| 1 | Database Foundation | 4 |
| 2 | Authentication | 6 |
| 3 | Database Query Modules | 9 |
| 4 | API Routes | 11 |
| 5 | Integrations | 4 |
| 6 | Frontend Integration | 13 |
| 7 | Security Hardening | 5 |
| 8 | Deployment | 6 |
| **Total** | | **63** |

---

## 12. Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── callback/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── clients/
│   │   │   ├── route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── [id]/stats/route.ts
│   │   ├── tickets/
│   │   │   ├── route.ts
│   │   │   ├── stats/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── [id]/notes/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   ├── stats/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   ├── [id]/stats/route.ts
│   │   │   └── [id]/tasks/
│   │   │       ├── route.ts
│   │   │       └── [taskId]/route.ts
│   │   ├── team/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── reports/
│   │   │   ├── revenue/route.ts
│   │   │   ├── team-performance/route.ts
│   │   │   ├── sla-compliance/route.ts
│   │   │   └── ticket-analytics/route.ts
│   │   ├── ai/
│   │   │   ├── chat/route.ts
│   │   │   └── conversations/
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   ├── notifications/
│   │   │   ├── route.ts
│   │   │   ├── unread-count/route.ts
│   │   │   └── mark-read/route.ts
│   │   ├── contact-submissions/
│   │   │   ├── route.ts
│   │   │   ├── webhook/route.ts
│   │   │   └── [id]/route.ts
│   │   └── settings/
│   │       └── profile/route.ts
│   ├── (portal)/                           # Existing frontend pages (unchanged)
│   ├── login/
│   ├── layout.tsx
│   └── globals.css
├── components/                             # Existing (unchanged)
├── lib/
│   ├── api/
│   │   ├── client.ts                       # Frontend fetch wrapper
│   │   ├── response.ts                     # API response helpers
│   │   ├── rate-limit.ts                   # Rate limiter
│   │   └── query-client.ts                 # React Query config + key factory
│   ├── auth/
│   │   ├── azure-ad.ts                     # Azure AD OAuth2 helpers
│   │   ├── session.ts                      # JWT session management
│   │   └── middleware.ts                   # withManagementAuth, withRole
│   ├── db/
│   │   ├── client.ts                       # PostgreSQL pool (no RLS scope)
│   │   ├── migrations/
│   │   │   ├── 005_management_tables.sql
│   │   │   └── 006_extend_user_roles.sql
│   │   ├── migrate.ts                      # Migration runner
│   │   ├── seed.ts                         # Seed data (management users, client profiles)
│   │   └── queries/
│   │       ├── clients.ts
│   │       ├── tickets.ts
│   │       ├── projects.ts
│   │       ├── team.ts
│   │       ├── reports.ts
│   │       ├── ai.ts
│   │       ├── notifications.ts
│   │       ├── contact-submissions.ts
│   │       ├── activity-log.ts
│   │       └── report-snapshots.ts
│   ├── integrations/
│   │   ├── graph/
│   │   │   └── planner-write.ts
│   │   ├── claude/
│   │   │   ├── client.ts
│   │   │   ├── context-builder.ts
│   │   │   └── system-prompt.ts
│   │   └── mail/
│   │       └── sender.ts
│   ├── validators/
│   │   ├── clients.ts
│   │   ├── tickets.ts
│   │   ├── projects.ts
│   │   ├── team.ts
│   │   ├── reports.ts
│   │   ├── ai.ts
│   │   ├── notifications.ts
│   │   ├── contact-submissions.ts
│   │   └── settings.ts
│   ├── utils.ts
│   └── fonts.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-clients.ts
│   ├── use-tickets.ts
│   ├── use-projects.ts
│   ├── use-team.ts
│   ├── use-reports.ts
│   ├── use-ai.ts
│   ├── use-notifications.ts
│   └── use-contact-submissions.ts
├── stores/
│   ├── sidebar-store.ts
│   ├── notification-store.ts
│   └── toast-store.ts
├── data/                                   # Mock data (to be removed after wiring)
├── types/
│   └── index.ts
└── __tests__/
    ├── test-constants.ts                   # Well-known test UUIDs and email domain
    ├── seed-test-data.ts                   # Creates test org + all test data
    ├── cleanup.ts                          # Deletes all test data by org ID + email
    ├── setup.ts                            # Global setup: cleanup → seed
    ├── teardown.ts                         # Global teardown: cleanup
    ├── phase-1/                            # Database foundation tests
    ├── phase-2/                            # Authentication tests
    ├── phase-3/                            # Query module tests
    ├── phase-4/                            # API route tests
    ├── phase-5/                            # Integration tests
    ├── phase-7/                            # Security hardening tests
    └── integration/                        # Cross-portal tests
```

---

## 13. Common vs Different — Client Portal Comparison

### What's Shared (Reused)

| Component | Details |
|-----------|---------|
| **PostgreSQL Database** | Same instance, same 17 existing tables. Management adds 7 new tables. |
| **Sync Jobs** | Existing Azure Functions feed both portals. Zero duplication. |
| **Azure AD Tenant** | Same tenant. Different app registrations. |
| **`users` Table** | Single table. Client users have `organization_id` set, management users have it `NULL`. |
| **Data Tables** | `tickets`, `projects`, `project_tasks`, `documents`, `software_subscriptions`, `infrastructure_items`, `cloud_services` — both portals read from these. |
| **Design System** | Same colors, fonts, shadcn/ui components, Tailwind v4, shadow levels. |
| **Frontend Stack** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts, Framer Motion, Zustand, React Query. |
| **Backend Stack** | `pg`, `jose`, `zod`, `@anthropic-ai/sdk`, `@microsoft/microsoft-graph-client`. |
| **Code Patterns** | Same commit convention, API response format, folder structure, validation pattern, hook pattern. |
| **Security Standards** | Same rules — parameterized SQL, generic errors, security headers, rate limiting, Key Vault. |
| **Claude API** | Same SDK and client wrapper. Different system prompts. |
| **Outlook Mail** | Same `Mail.Send` for notifications. |

### What's Different

| Aspect | Client Portal | Management Portal |
|--------|---------------|-------------------|
| **Audience** | External clients (2 → 15+) | Internal Flux team (5 employees) |
| **Data Access** | Single org only (org-scoped) | All orgs (cross-org) |
| **Azure AD App** | `flux-clientportal-dev` | `flux-management-dev` (new) |
| **JWT Cookie** | `flux-session` | `flux-management-session` |
| **JWT Payload** | Includes `organizationId` | No `organizationId` |
| **User Roles** | `client` | `co-ceo`, `director`, `employee` |
| **RLS** | Yes — 3-layer enforcement | No — middleware-only |
| **DB Client** | `withOrgScope()` sets RLS param | Direct queries, no RLS scoping |
| **Auth Middleware** | `withAuth` (org-scoped) | `withManagementAuth` + `withRole` |
| **Write Operations** | Read-only | Read + write tasks (dual-write DB + Planner) |
| **Graph API Permission** | `Tasks.Read.All` | `Tasks.ReadWrite.All` |
| **AI Context** | One client's data | All clients + revenue + team metrics |
| **Unique Pages** | Documents, Tech Stack, Help | Clients, Team, Reports (4 types), Contact Submissions |
| **Unique Tables** | — | 7 new tables (see §4) |
| **Notifications** | 3 types | 6 types |
| **Network Access** | Public | Restricted (IP whitelist / VPN) |
| **Deployment** | Azure App Service #1 | Azure App Service #2 |

### Files That Can Be Adapted from Client Portal

| Source File (Client Portal) | What Changes for Management Portal |
|---|---|
| `lib/auth/azure-ad.ts` | New client ID, redirect URI |
| `lib/auth/session.ts` | Cookie name → `flux-management-session`, no `organizationId` in payload |
| `lib/auth/middleware.ts` | `withManagementAuth` replaces `withAuth`, add `withRole` |
| `lib/api/response.ts` | Identical — copy as-is |
| `lib/api/rate-limit.ts` | Identical — copy as-is |
| `lib/api/client.ts` | Identical pattern |
| `lib/api/query-client.ts` | Identical pattern, new query keys |
| `lib/integrations/claude/client.ts` | Identical — copy as-is |
| `lib/integrations/graph/mail.ts` | Identical — copy as-is |
| `lib/db/client.ts` | Remove `withOrgScope()`, plain pool |
| `lib/db/migrate.ts` | Identical — copy as-is |
| Auth API routes | Same flow, different cookie/redirect |
