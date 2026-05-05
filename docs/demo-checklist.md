# Demo Checklist — Production Verification

**URL:** https://flux-management.vercel.app
**Date:** May 5, 2026
**Production DB state at time of writing:**

| Table | Count | Status |
|-------|-------|--------|
| tickets | 1,858 | Real Atera data |
| projects | 16 (11 real Dataverse + 5 sample) | Real + sample |
| project_tasks | 46 | Real Dataverse tasks |
| documents | 818 | Real SharePoint data |
| users (non-client) | 7 (4 real + 3 demo) | OK |
| team_members | **0** | EMPTY — needs seeding |
| client_profiles | **0** | EMPTY — needs creating |
| software_subscriptions | **0** | EMPTY — needs sync |
| infrastructure_items | **0** | EMPTY — needs sync |
| cloud_services | **0** | EMPTY — needs sync |
| contact_submissions | 0 | Expected empty |
| management_notifications | 0 | Expected empty |
| ai_conversations | 10 | From client portal |
| connector_statuses | 12 | Real sync status |

---

## Page-by-Page Checklist

### 1. Login Page
- [ ] Login page loads at /login
- [ ] "Co-CEO" dev login button visible
- [ ] "Director" dev login button visible
- [ ] "Employee" dev login button visible
- [ ] Co-CEO login → redirects to /dashboard, shows "Co-CEO" in sidebar
- [ ] Director login → works, shows "Director"
- [ ] Employee login → works, shows "Employee"
- [ ] SSO "Sign in with Microsoft" → redirects to Microsoft, completes login
- [ ] Logout works (sidebar sign-out icon or /api/auth/logout)

### 2. Dashboard
- [ ] Greeting shows "Good morning, Co-CEO" (or correct role)
- [ ] Date is correct
- [ ] "Last synced" shows real time (not "2 min ago")
- [ ] **Panel 1 — Clients:** Shows count (expect 2 — Armada + OnPoint, Flux excluded)
- [ ] **Panel 2 — Tickets:** Shows open ticket count + critical/pending
- [ ] **Panel 3 — Projects:** Shows project count + at-risk/delayed
- [ ] Clicking panels navigates to correct page
- [ ] **Ticket Activity Chart:** Shows bar chart with 7d/30d/90d toggle
- [ ] Chart has data (not empty)
- [ ] **Projects by Status:** Pie chart renders
- [ ] **Tech Stack Health Cards:** ⚠️ **WILL BE EMPTY** — no infrastructure/software/cloud data in production
- [ ] **Recent Tickets table:** Shows 5 recent tickets with real data
- [ ] **Active Projects carousel:** Shows project cards
- [ ] Quick actions bar at bottom (New Ticket, Export, AI Assistant)

### 3. Clients Page
- [ ] Shows list of clients (Armada Analytics, OnPoint CFO)
- [ ] Flux Technologies is NOT shown (excluded by slug)
- [ ] Search works
- [ ] Industry filter works
- [ ] "No profile" badge shows (client_profiles is empty)
- [ ] Click client → navigates to client detail

### 4. Client Detail Page
- [ ] Back button works
- [ ] Client name displays
- [ ] KPIs show (open tickets, active projects)
- [ ] **Overview tab:** Recent tickets + active projects
- [ ] **Tickets tab:** Shows client's tickets in table
- [ ] **Projects tab:** Shows client's projects
- [ ] **Profile tab:** Shows "No profile" state, Edit button
- [ ] Profile edit form works (save creates profile)

### 5. Tickets Page
- [ ] Paginated table loads with real tickets
- [ ] Search by ticket # or subject works
- [ ] Status filter works (All, Open, Pending, Closed)
- [ ] Priority filter works (All, Critical, High, Medium, Low)
- [ ] Pagination (Prev/Next) works
- [ ] Total count shown
- [ ] Click row → ticket slide-over detail opens

### 6. Projects Page
- [ ] Projects load (expect 16 — 11 real + 5 sample)
- [ ] **Cards view** renders project cards
- [ ] **List view** renders table
- [ ] **Timeline/Gantt view** renders bars
- [ ] View toggle works
- [ ] Progress bars show real percentages
- [ ] Click project → navigates to detail

### 7. Project Detail Page
- [ ] Project name, status badge, due date display
- [ ] **Tasks tab:** Kanban board with To Do / In Progress / Review / Complete columns
- [ ] Real tasks appear in correct columns
- [ ] "Add Task" button shows form
- [ ] Task create works (⚠️ CAREFUL — writes to DB, may write to Dataverse for real projects)
- [ ] Click task → shows status change buttons
- [ ] Delete button shows with confirm dialog
- [ ] **Timeline tab:** Gantt chart renders
- [ ] **Overview tab:** Description, team, completion chart

### 8. Team Page
- [ ] ⚠️ **WILL BE EMPTY** — team_members table has 0 rows
- [ ] Should show empty/loading state gracefully (not crash)

### 9. Tech Stack Page
- [ ] KPI cards show counts (⚠️ all will be 0)
- [ ] **Software table:** ⚠️ **EMPTY** — no software_subscriptions in production
- [ ] **Infrastructure table:** ⚠️ **EMPTY** — no infrastructure_items in production
- [ ] **Cloud Services table:** ⚠️ **EMPTY** — no cloud_services in production
- [ ] "Add Software" button works
- [ ] "Add Cloud Service" button works
- [ ] ⚠️ Empty state messages show (not crash)

### 10. Documents Page
- [ ] Shows 818 documents
- [ ] Folder hierarchy renders (Armada Analytics / OnPoint folders at root)
- [ ] Click folder → navigates into it
- [ ] Breadcrumbs work
- [ ] Search works
- [ ] List/Grid toggle works
- [ ] "Open in SharePoint" link works
- [ ] Client filter works (sidebar dropdown)

### 11. Reports Page
- [ ] Report selector shows 3 cards
- [ ] **Ticket Activity Report:** Generates with real ticket data
- [ ] Range toggle (7d/30d/90d) works
- [ ] Print button works
- [ ] **Project Progress Report:** Shows real projects with progress bars
- [ ] **Full Management Summary:** Combined report with all data
- [ ] Back button returns to selector

### 12. Leads (Contact Submissions) Page
- [ ] Shows empty state (no submissions yet) — should not crash
- [ ] Status filter tabs render (All, New, Reviewed, Responded)

### 13. Connectors Page
- [ ] Shows 4 connectors (Atera, Planner, SharePoint, Outlook)
- [ ] Atera shows "Connected" for Armada/OnPoint
- [ ] Planner shows "Connected" for Armada/OnPoint
- [ ] SharePoint shows "Connected" for Armada/OnPoint
- [ ] Last synced times are real
- [ ] Per-client breakdown visible

### 14. AI Assistant Page
- [ ] Chat interface loads
- [ ] Suggested queries show
- [ ] Click a suggested query → sends message
- [ ] AI responds with real data (ticket counts, project names, etc.)
- [ ] Markdown formatting works (bold, lists, tables)
- [ ] Follow-up questions work
- [ ] ⚠️ AI context may show 0 for tech stack/team (empty tables)

### 15. Settings Page
- [ ] Profile tab shows role name (Co-CEO/Director/Employee)
- [ ] Notifications tab shows 3 active notification types
- [ ] Security tab shows SSO status, RBAC, encryption info
- [ ] No fake buttons or non-functional UI

### 16. Sidebar
- [ ] All 11 nav items visible (Dashboard, Clients, Tickets, Projects, Team, Tech Stack, Documents, Reports, Leads, Connectors, AI Assistant, Settings)
- [ ] Client filter dropdown works
- [ ] Selecting a client filters all pages
- [ ] "All Clients" resets filter
- [ ] Collapse/expand works (desktop)
- [ ] User block shows role name (not real name)
- [ ] Sign out icon works

### 17. Global / Cross-Cutting
- [ ] No console errors (except browser extension CSP)
- [ ] Pages load under 5 seconds
- [ ] Mobile responsive (sidebar collapses, tables scroll)
- [ ] No "undefined" or "null" text visible on any page
- [ ] No crashes on any page

---

## Known Empty Pages (Need Data)

| Page | Why Empty | Fix |
|------|-----------|-----|
| **Team** | `team_members` table = 0 rows | Seed team members from `users` table |
| **Tech Stack** | No Atera/SharePoint sync against prod DB | Run sync from client portal, or seed manually |
| **Dashboard tech stack cards** | Same as above | Same fix |

## Quick Fixes Before Demo

### Fix 1: Seed team_members (2 min)
```sql
INSERT INTO team_members (user_id, department, status, hire_date)
SELECT id, 'Technology', 'active', '2024-01-01'
FROM users WHERE role != 'client' AND is_active = true
AND email NOT LIKE 'demo-%';
```

### Fix 2: Trigger Atera sync for tech stack (needs client portal running)
Or manually insert sample tech stack data.

### Fix 3: Add client profiles (2 min)
```sql
INSERT INTO client_profiles (organization_id, industry, primary_contact_name)
SELECT id, 
  CASE WHEN slug = 'armada-analytics' THEN 'Financial Services' ELSE 'Professional Services' END,
  CASE WHEN slug = 'armada-analytics' THEN 'Client Contact' ELSE 'Client Contact' END
FROM organizations WHERE slug IN ('armada-analytics', 'onpoint-cfo');
```
