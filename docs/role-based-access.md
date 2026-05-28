# Role-Based Access Control — Flux Management Portal

Three roles exist: **co-ceo**, **director**, **employee**.  
Co-CEO and Director have identical access — full everything.  
This document focuses on where **Employee** differs.

---

## Dashboard

**Co-CEO / Director:** Company-wide KPIs — total open tickets across all clients, MRR, active projects, team utilization, client health overview.

**Employee:** Personal performance dashboard only.
- Tickets assigned to them (open, in progress, resolved this week/month)
- Tasks assigned to them across all projects
- Their own avg resolution time vs. team average
- No company-wide revenue, no MRR, no client health scores, no team utilization overview

---

## Clients

**Co-CEO / Director:** Full client profiles — company info, contract value, billing status, health score, contacts, notes, all linked data.

**Employee:** Read-only, full visibility.
- Can see everything: client name, industry, contacts, health score, active services, internal notes
- Cannot create, edit, or delete any client record
- Cannot see contract value or monthly revenue (financial/billing details only)
- Employees work directly with clients on tickets and projects — they need full context

---

## Tickets

**Co-CEO / Director:** Full access — view all tickets across all clients, filter/sort/search, view stats and trends, export.

**Employee:** Read-only across all tickets.
- Can view all client tickets (they need context to handle support)
- Can filter by client, status, priority, assigned technician
- Can see ticket detail — description, activity log, attachments
- Cannot reassign, change status, add internal notes, or close tickets from the management portal
  *(Ticket updates happen in Atera, which syncs back — not directly in this portal)*
- No ticket stats/trend charts (those are management-level reporting)

---

## Projects

**Co-CEO / Director:** Full project management — create projects, manage tasks, reassign, change status, view all metrics.

**Employee:** Split access — read on projects, write on own tasks.
- Can view all projects and their timelines (read-only)
- Can view all tasks within a project (read-only)
- Can update status of tasks assigned to them (To Do → In Progress → Complete)
- Cannot create or delete projects
- Cannot create tasks (only co-ceo/director can scope work)
- Cannot reassign tasks to other team members
- Cannot change project-level status or due dates

---

## Team

**Co-CEO / Director:** Full team management — view all members, edit profiles, toggle active/inactive, see all metrics.

**Employee:** Read-only directory.
- Can see all active team members: name, role, department, email
- Can see colleague metrics (tickets resolved, active tasks) — useful for knowing who to coordinate with
- Cannot see inactive/deactivated members
- Cannot toggle active/inactive status
- Cannot edit any team member's profile, capacity, or utilization settings
- Cannot see their own hire date or internal capacity settings

---

## Tech Stack

**Co-CEO / Director:** Full access — view all client tech stacks, software subscriptions, infrastructure items, cloud services. Can see costs.

**Employee:** Read-only, costs hidden.
- Can view software subscriptions, infrastructure items, cloud services per client
- Cannot see cost/pricing fields (monthly cost, license cost, contract value)
- Cannot add, edit, or remove any tech stack items
- Useful for knowing client environments before working a ticket or project

---

## Documents

**Co-CEO / Director:** Full access — view, upload, organize, delete documents across all clients.

**Employee:** Read-only, download allowed.
- Can browse and search all documents across all clients
- Can preview and download files (runbooks, SOPs, network diagrams, client docs)
- Cannot upload new documents
- Cannot delete or rename documents
- Cannot create or manage folder structure

---

## Reports

**Co-CEO / Director:** All reports — ticket trends, project velocity, team performance, client health, financial summaries, exports.

**Employee:** IT operational reports — full access within that scope.
- Can see: ticket volume trends, resolution time trends, project completion rates, open vs. closed by client, team ticket workload
- Can interact fully — filter by date range, filter by client, drill down, export
- Cannot see: revenue reports, MRR trends, client contract reports, cost analysis, financial summaries
- The reports page is shown, but financial/business report sections are hidden — IT reports are fully unlocked

---

## AI Assistant

**Co-CEO / Director:** Full operational context — can ask about any client, financials, team metrics, reports, everything in the system.

**Employee:** Full access, same interface, but naturally limited by their data visibility.
- Can ask questions about tickets, projects, documents, tech stack, team
- Responses will not include financial data, contract values, or business metrics (they don't have access to that data)
- No special restrictions needed — the AI only surfaces data the user's role can see

---

## Leads (Contact Submissions)

**Co-CEO / Director:** Full access — view all inbound leads from the marketing website contact form, status, follow-up notes.

**Employee:** No access.
- Sales pipeline is not relevant to a technical employee's role
- Page should not appear in their sidebar at all

---

## Connectors

**Co-CEO / Director:** Full access — view integration status for Atera, SharePoint, Planner, Graph API. Can trigger manual syncs.

**Employee:** No access.
- Infrastructure and integration management is an admin function
- Page should not appear in their sidebar at all

---

## Settings

**Co-CEO / Director:** Full access to their own profile. Can also manage system-level settings if any exist.

**Employee:** Own profile only.
- Can update their name, phone number
- Can manage notification preferences
- Cannot access any team-level or system-level settings
- Same as co-ceo/director in scope — just their own account

---

## Summary Matrix

| Page | Co-CEO / Director | Employee |
|---|---|---|
| Dashboard | All KPIs | Personal metrics only |
| Clients | Full + edit | Read-only, financial fields hidden |
| Tickets | Full + stats | Read-only, no stats |
| Projects | Full + create/manage | Read + edit own tasks only |
| Team | Full + toggle active | Read-only, active members only |
| Tech Stack | Full + costs | Read-only, costs hidden |
| Documents | Full + upload/delete | Read-only + download |
| Reports | All reports + export | IT operational reports, full access within that scope |
| AI Assistant | Full context | Full access, limited by data visibility |
| Leads | Full | No access (hidden) |
| Connectors | Full | No access (hidden) |
| Settings | Own profile | Own profile |
