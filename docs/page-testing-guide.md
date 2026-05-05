# Flux Management Portal — Page Testing Guide

> Comprehensive guide for manually testing every page in the management portal.
> Log in as Brandon Devier (co-ceo) via dev-login to test all features.
>
> **Last updated:** April 25, 2026

---

## Login — `/login`

**What it does:** Azure AD SSO authentication for Flux Technologies management team.

**What you should see:**
- Left panel: Flux branding, "Management Command Center" heading
- Right panel: "Sign in with Microsoft SSO" button
- Dev-only: 3 dev-login buttons (Brandon, Zack, Cameron) — only visible in development

**Test scenarios:**
- [ ] Click "Sign in with Microsoft SSO" → redirects to Azure AD → returns to `/dashboard`
- [ ] Dev-login buttons create session and redirect to `/dashboard`
- [ ] Error messages display correctly (`?error=auth_failed`, `?error=access_denied`, etc.)
- [ ] Client role users are blocked at login (403 from callback)

---

## Dashboard — `/dashboard`

**What it does:** Executive overview of the entire business — revenue, tickets, projects, team.

**What you should see:**

| Section | Expected Content |
|---|---|
| Greeting | "Good morning, Brandon" (from real auth) |
| Revenue panel | Total monthly revenue (e.g., $70K), client count, sparkline chart |
| Tickets panel | Open ticket count, critical/pending breakdown, avg resolution hours |
| Projects panel | Active project count, at-risk/delayed breakdown, team member count, utilization % |
| Ticket Activity chart | Stacked bar chart (Open/Pending/Closed) with 7d/30d/90d toggle |
| Projects by Status | Donut chart (On Track/At Risk/Delayed) |
| Recent Tickets | 5 most recent tickets with #, subject, client, status badge, priority, date |
| Active Projects | Horizontal scrollable cards with progress bars |
| Quick Actions | Floating bottom bar: New Ticket, Export, AI Assistant |

**Test scenarios:**
- [ ] All 3 KPI panels show non-zero real data
- [ ] Clicking Revenue panel → navigates to `/clients`
- [ ] Clicking Tickets panel → navigates to `/tickets`
- [ ] Clicking Projects panel → navigates to `/projects`
- [ ] Recent Tickets rows are clickable (open slide-over)
- [ ] Active Projects cards navigate to `/projects/[id]`
- [ ] Chart range toggle (7d/30d/90d) switches data
- [ ] Sync button shows spinning animation

**API endpoints called:**
- `GET /api/dashboard`
- `GET /api/tickets?limit=5&sort=created_at&order=desc`
- `GET /api/projects?limit=10&sort=created_at&order=desc`

---

## Clients — `/clients`

**What it does:** List all client organizations with health, revenue, and ticket overview.

**What you should see:**
- Table with columns: Company Name, Primary Contact (name + email), Industry, Health Score (colored dot), Contract Status (badge), Monthly Revenue, Open Tickets, SLA %, arrow icon
- Real clients: Armada Analytics, OnPoint CFO (and any others)
- Test org (`Flux QA Internal`) should NOT appear

**Filters:**
- Search box: filters by company name
- Industry dropdown: Financial Services, Professional Services, Technology, Healthcare, Legal
- Health Score dropdown: Healthy, At Risk, Critical
- Contract Status dropdown: Active, Expiring, Expired

**Test scenarios:**
- [ ] Real clients appear with correct revenue and ticket counts
- [ ] Test org is excluded (is_active=false filter)
- [ ] Search filters work (type partial company name)
- [ ] Dropdown filters work (select industry, health, contract status)
- [ ] Clicking a row navigates to `/clients/[id]`
- [ ] "Add Client" button visible

**API:** `GET /api/clients?search=X&industry=Y&healthScore=Z&contractStatus=W`

---

## Client Detail — `/clients/[id]`

**What it does:** Full profile for a single client with tickets, projects, and contacts.

**Tabs:**

### Overview (default)
- 4 KPI cards: Monthly Revenue, SLA Target, Open Tickets, Active Projects
- Recent Tickets (5 rows) and Active Projects grid

### Tickets
- Full table: Ticket #, Subject, Status, Priority, Assigned To, Updated
- Click row → TicketSlideOver

### Projects
- 2-column grid of project cards with status, progress, tasks, due date

### Contacts
- Primary contact card with avatar, name, email, phone

**Test scenarios:**
- [ ] Back button returns to `/clients`
- [ ] All 4 tabs load without errors
- [ ] KPI cards show correct numbers
- [ ] Ticket rows are clickable (open slide-over)
- [ ] Project cards navigate to `/projects/[id]`
- [ ] Non-existent client ID shows "Client not found"

**API:**
- `GET /api/clients/[id]`
- `GET /api/tickets?clientId=[id]&limit=50`
- `GET /api/projects?clientId=[id]&limit=50`

---

## Tickets — `/tickets`

**What it does:** All tickets across all clients with filtering and pagination.

**What you should see:**
- Table: Ticket #, Subject, Client name, Status badge, Priority indicator, Assigned To (avatar + name), Updated date
- Pagination: "X tickets", Prev/Next, "Page X of Y"
- 10 tickets per page

**Filters:**
- Search: by ticket # or subject
- Status: All, Open, Pending, Closed
- Priority: All, Critical, High, Medium, Low

**Test scenarios:**
- [ ] Shows 1,700+ total tickets across all clients
- [ ] Test org tickets excluded
- [ ] Status filter works (select "Open" → only open tickets)
- [ ] Priority filter works
- [ ] Search works (type a ticket subject keyword)
- [ ] Pagination: Next/Prev buttons work, page count is correct
- [ ] Click row → TicketSlideOver opens
- [ ] Filters reset page to 1

**API:** `GET /api/tickets?status=X&priority=Y&search=Z&page=N&limit=10`

---

## Projects — `/projects`

**What it does:** All projects across all clients with 3 view modes.

**KPI Cards:**
- Active Projects count
- Tasks Completed (X/Y)
- On Track percentage

**View Modes (toggle buttons top-right):**

### Cards View
- Grid of project cards: status dot, name, client name, progress bar, task count, due date, assignee avatars

### List View
- Table: Project Name, Status badge, Progress (bar + %), Tasks (X/Y), Due Date, Assignees

### Timeline View
- Gantt-style: month labels, project bars, "Today" line, completion fill

**Test scenarios:**
- [ ] All 3 KPI cards show real data
- [ ] Cards/List/Timeline toggle works
- [ ] Projects show real client names
- [ ] Progress bars reflect actual completion
- [ ] Click project → navigates to `/projects/[id]`
- [ ] Timeline renders without errors (handles API date format)

**API:** `GET /api/projects`

---

## Project Detail — `/projects/[id]`

**What it does:** Single project with task board, timeline, files, tech stack, and overview.

**Tabs:**
1. **Tasks** — Kanban board (To Do, In Progress, Review, Complete columns)
2. **Timeline** — Gantt chart with task bars
3. **Files** — Placeholder (empty state)
4. **Tech Stack** — Software subscriptions table
5. **Overview** — Description, key dates, team members, completion chart

**Test scenarios:**
- [ ] Back button returns to `/projects`
- [ ] All 5 tabs load without errors
- [ ] Task cards show in correct columns by status
- [ ] Non-existent project ID shows "Project not found"

**API:** `GET /api/projects/[id]`

---

## Team — `/team`

**What it does:** Grid of team member cards with performance metrics.

**Card contents:**
- Avatar (initials), name, active/invited status dot
- Email, role badge (Co-CEO/Director/Employee with color)
- Utilization bar (0-100%)
- Stats: active tasks count, resolved tickets count
- Department

**Test scenarios:**
- [ ] Shows all management team members (Brandon, Zack, Cameron + others)
- [ ] Role badges display correctly (co-ceo = blue, director = green, employee = gray)
- [ ] Utilization bars render
- [ ] "Invite Member" button visible

**API:** `GET /api/team`

---

## Reports — `/reports`

**What it does:** Landing page with 4 report type cards.

**Report types:**
1. **Revenue Report** — Revenue breakdown by client
2. **Team Performance** — Utilization and productivity metrics
3. **SLA Compliance** — SLA % per client
4. **Ticket Analytics** — Volume, resolution time, priority breakdown

**Test scenarios:**
- [ ] All 4 cards visible
- [ ] Click card → navigates to `/reports/[type]`
- [ ] Employee users should get 403 (co-ceo/director only)

**API:** Individual report APIs called per type:
- `GET /api/reports/revenue`
- `GET /api/reports/team-performance`
- `GET /api/reports/sla-compliance`
- `GET /api/reports/ticket-analytics`

**Role restriction:** Co-CEO and Director only (withRole gate)

---

## AI Assistant — `/ai-assistant`

**What it does:** Claude-powered chat with cross-org business context.

**What you should see:**
- Empty state: icon, "Flux AI Assistant" title, 6 suggested query buttons
- After sending: chat messages (user right-aligned, assistant left-aligned)
- Input area: auto-resize textarea, send button
- Disclaimer: "AI responses are generated from your connected data sources. Always verify critical information."

**Suggested queries:**
- "Show all critical tickets across clients"
- "Which clients have at-risk health scores?"
- "What's the team utilization this month?"
- "Summarize revenue trends by client"
- "List projects that are behind schedule"
- "Show SLA compliance across all clients"

**Test scenarios:**
- [ ] Click suggested query → sends message
- [ ] Type message + Enter → sends
- [ ] Shift+Enter → newline (doesn't send)
- [ ] Response comes from real Claude API with actual business data
- [ ] Response references real client names and ticket counts
- [ ] Typing indicator shows while waiting for response
- [ ] Conversation persists within session

**API:**
- `POST /api/ai/chat` — send message, get Claude response
- `GET /api/ai/conversations` — list past conversations

**Role restriction:** Co-CEO and Director only

---

## Settings — `/settings`

**What it does:** User profile and portal configuration.

**Tabs:**
1. **General** — Avatar, name, email, role, company, phone, timezone. Save button.
2. **Team Management** — Role permissions matrix
3. **Integrations** — Atera, Microsoft 365, SharePoint, Slack connection cards
4. **Notifications** — Email/Push toggles for 6 notification categories
5. **Security** — Password change, 2FA, active sessions

**Test scenarios:**
- [ ] General tab shows real user name and email from auth
- [ ] All 5 tabs load without errors
- [ ] Save Changes button visible on General tab

**API:** `GET /api/auth/me` (for user data), `GET /api/settings/profile`

---

## Connectors — `/connectors`

**What it does:** Shows integration health for all external services.

**Connector cards:**
- **Atera** — IT helpdesk tickets and device monitoring
- **Microsoft Planner** — Project tasks and assignments
- **SharePoint** — Documents and tech stack data
- **Outlook** — Email notifications

**Card contents:**
- Icon, name, description
- Status: Connected (green checkmark) or Disconnected (red warning)
- Stats: "X records synced"
- Last synced timestamp
- Reconnect button (if disconnected)

**Test scenarios:**
- [ ] All 4 connector cards appear
- [ ] Connected connectors show green status + record counts
- [ ] Disconnected connectors show red status + reconnect button
- [ ] "Add Connector" button visible

**API:** `GET /api/connectors`

---

## Cross-Cutting Test Scenarios

### Authentication
- [ ] Unauthenticated users redirect to `/login` on any portal page
- [ ] Sign Out button clears session and redirects to `/login`
- [ ] Session expires after 24 hours

### Role-Based Access
- [ ] Log in as Brandon (co-ceo) → all pages accessible
- [ ] Log in as Cameron (director) → all pages accessible
- [ ] Log in as employee → Reports, AI, Contact Submissions return 403
- [ ] Client role users blocked entirely at login

### Data Isolation
- [ ] Test org (`Flux QA Internal`) never appears in any page
- [ ] Dashboard KPIs only count active org data
- [ ] AI context excludes test org data

### Navigation
- [ ] Sidebar links work for all pages
- [ ] Command palette (Cmd+K) opens and searches
- [ ] Notification bell shows unread count
- [ ] User dropdown shows real name/email/initials
- [ ] Mobile bottom nav works on small screens

### Error Handling
- [ ] Invalid URLs show 404 page
- [ ] API errors show "Something went wrong" error boundary
- [ ] Loading states show while data fetches

### Performance
- [ ] Dashboard loads within 2 seconds
- [ ] Tickets pagination is responsive
- [ ] No visible layout shift during data load
