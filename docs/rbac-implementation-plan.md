# RBAC Implementation Plan — Flux Management Portal

Reference: `docs/role-based-access.md` for the full access spec.

## Overview

The current portal shows the same UI to all roles. This plan wires up role-based access across the entire stack — permissions config, hook, sidebar, page guards, per-page field/button restrictions, and API enforcement.

**Roles:** `co-ceo` | `director` | `employee`  
Co-CEO and Director are identical — full access everywhere.  
All changes below are scoped to restricting the **employee** role.

---

## Step 1 — Central Permissions Config

**File:** `src/lib/permissions.ts`

Create a single source of truth that maps roles to boolean permission flags. Every access decision in the app derives from this file — nothing hardcodes role strings elsewhere.

```ts
export type Role = "co-ceo" | "director" | "employee";

export interface Permissions {
  // Navigation
  canAccessLeads: boolean;
  canAccessConnectors: boolean;

  // Clients
  canEditClients: boolean;
  canSeeClientFinancials: boolean; // contract value, MRR

  // Tickets
  canSeeTicketStats: boolean;

  // Projects
  canCreateProjects: boolean;
  canCreateTasks: boolean;
  canEditAnyTask: boolean;     // false = own tasks only

  // Team
  canEditTeamMembers: boolean;
  canToggleTeamStatus: boolean;
  canSeeInactiveMembers: boolean;

  // Tech Stack
  canSeeTechStackCosts: boolean;
  canEditTechStack: boolean;

  // Documents
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;

  // Reports
  canSeeFinancialReports: boolean;

  // Dashboard
  seePersonalDashboardOnly: boolean;
}

export const PERMISSIONS: Record<Role, Permissions> = {
  "co-ceo": {
    canAccessLeads: true, canAccessConnectors: true,
    canEditClients: true, canSeeClientFinancials: true,
    canSeeTicketStats: true,
    canCreateProjects: true, canCreateTasks: true, canEditAnyTask: true,
    canEditTeamMembers: true, canToggleTeamStatus: true, canSeeInactiveMembers: true,
    canSeeTechStackCosts: true, canEditTechStack: true,
    canUploadDocuments: true, canDeleteDocuments: true,
    canSeeFinancialReports: true,
    seePersonalDashboardOnly: false,
  },
  director: {
    // identical to co-ceo
    canAccessLeads: true, canAccessConnectors: true,
    canEditClients: true, canSeeClientFinancials: true,
    canSeeTicketStats: true,
    canCreateProjects: true, canCreateTasks: true, canEditAnyTask: true,
    canEditTeamMembers: true, canToggleTeamStatus: true, canSeeInactiveMembers: true,
    canSeeTechStackCosts: true, canEditTechStack: true,
    canUploadDocuments: true, canDeleteDocuments: true,
    canSeeFinancialReports: true,
    seePersonalDashboardOnly: false,
  },
  employee: {
    canAccessLeads: false, canAccessConnectors: false,
    canEditClients: false, canSeeClientFinancials: false,
    canSeeTicketStats: false,
    canCreateProjects: false, canCreateTasks: false, canEditAnyTask: false,
    canEditTeamMembers: false, canToggleTeamStatus: false, canSeeInactiveMembers: false,
    canSeeTechStackCosts: false, canEditTechStack: false,
    canUploadDocuments: false, canDeleteDocuments: false,
    canSeeFinancialReports: false,
    seePersonalDashboardOnly: true,
  },
};

export function getPermissions(role: string): Permissions {
  return PERMISSIONS[role as Role] ?? PERMISSIONS.employee;
}
```

---

## Step 2 — usePermissions Hook

**File:** `src/hooks/use-permissions.ts`

Thin hook that reads from `useAuth()` and returns the permissions object for the current user. All pages/components import this — never import `useAuth` just to check a role string.

```ts
import { useAuth } from "./use-auth";
import { getPermissions, type Permissions } from "@/lib/permissions";

export function usePermissions(): Permissions {
  const { data: auth } = useAuth();
  return getPermissions((auth as any)?.role ?? "employee");
}
```

---

## Step 3 — Sidebar: Hide Restricted Nav Items

**File:** `src/components/layout/sidebar/sidebar.tsx`

Two nav items — Leads and Connectors — should not appear at all for employees.

- Import `usePermissions`
- Filter `mainNav` before rendering: skip Leads if `!perms.canAccessLeads`, skip Connectors if `!perms.canAccessConnectors`
- No "locked" state — items simply don't appear

---

## Step 4 — Route Guard: Block Direct URL Access

**File:** `src/components/shared/role-guard.tsx` (new)

A client component that wraps pages employees shouldn't reach even by typing the URL directly. Reads role from `useAuth`, redirects to `/dashboard` if the user lacks access.

```tsx
// Usage in page.tsx:
<RoleGuard allowed={["co-ceo", "director"]}>
  <PageContent />
</RoleGuard>
```

**Apply to:**
- `/leads/page.tsx`
- `/connectors/page.tsx`

---

## Step 5 — Dashboard: Employee Personal View

**File:** `src/app/(portal)/dashboard/page.tsx`

When `perms.seePersonalDashboardOnly` is true, render a completely different set of KPI cards scoped to the current user instead of the company-wide view.

Employee dashboard shows:
- **My Open Tickets** — tickets assigned to them with status Open/In Progress
- **Resolved This Month** — tickets they closed this month
- **My Active Tasks** — project tasks assigned to them not yet complete
- **Avg Resolution Time** — their personal average vs. team average

Implementation: the page already calls `useDashboard()`. Add a second query hook `useMyDashboard()` that hits a new endpoint `/api/dashboard/me` — returns the personal metrics above filtered by the logged-in user's name/email. Branch in the page component based on `perms.seePersonalDashboardOnly`.

**New API route needed:** `GET /api/dashboard/me`  
Returns personal KPIs from tickets and project_tasks filtered by the current user. Protected by `withManagementAuth` (no role restriction — all roles can call it).

---

## Step 6 — Clients Page: Hide Financial Fields

**File:** `src/app/(portal)/clients/[id]/page.tsx` (and client list if it shows financials)

When `!perms.canSeeClientFinancials`:
- Hide contract value field
- Hide monthly revenue / MRR field
- Hide billing status field

Everything else (name, industry, health score, contacts, internal notes, active services) remains fully visible. No read-only restrictions needed — the edit buttons are controlled separately via `canEditClients`.

Also hide the "Edit" / "Save" buttons when `!perms.canEditClients`.

---

## Step 7 — Tickets Page: Read-Only for Employees

**File:** `src/app/(portal)/tickets/page.tsx` and `src/app/(portal)/tickets/[id]/page.tsx`

When `!perms.canSeeTicketStats`:
- Hide the KPI stats row at the top of the tickets list page
- Hide the chart/trend section

No other restrictions needed — employees can view all ticket data. Ticket mutations happen in Atera, not this portal, so there are no action buttons to hide.

---

## Step 8 — Projects Page: Own Tasks Only

**File:** `src/app/(portal)/projects/[id]/page.tsx`

When `!perms.canEditAnyTask`:
- Task status dropdowns (To Do / In Progress / Complete) only render on tasks where `task.assignedToEmail === auth.email`
- All other tasks show status as a read-only badge
- Hide "Add Task" button (`!perms.canCreateTasks`)
- Hide "New Project" button on list page (`!perms.canCreateProjects`)

The `PUT /api/projects/:id/tasks/:taskId` API route needs a check: if the user is `employee`, verify the task is assigned to them before allowing the update. Return 403 otherwise.

---

## Step 9 — Team Page: Read-Only for Employees

**File:** `src/app/(portal)/team/page.tsx`

Already partially done (toggle calls `PUT /api/team/:id` which uses `withRole(["co-ceo", "director"])`). Complete the UI side:

- When `!perms.canToggleTeamStatus`: hide the toggle button entirely (already done in the toggle implementation — confirm it checks role)
- When `!perms.canSeeInactiveMembers`: force filter to "active" only, hide the All/Inactive filter tabs
- When `!perms.canEditTeamMembers`: no edit links/buttons visible (currently none exist, keep it that way)

---

## Step 10 — Tech Stack Page: Hide Cost Fields

**File:** `src/app/(portal)/tech-stack/page.tsx` (and any detail views)

When `!perms.canSeeTechStackCosts`:
- Hide any "Cost", "Monthly Cost", "License Cost", "Contract Value" columns/fields
- If tech stack items show per-unit cost in cards, hide those values

When `!perms.canEditTechStack`:
- Hide Add / Edit / Delete buttons

---

## Step 11 — Documents Page: Read-Only for Employees

**File:** `src/app/(portal)/documents/page.tsx`

When `!perms.canUploadDocuments`:
- Hide the "Upload" button

When `!perms.canDeleteDocuments`:
- Hide the delete action on document rows/cards

Download and browse remain fully available.

---

## Step 12 — Reports Page: Hide Financial Sections

**File:** `src/app/(portal)/reports/page.tsx`

When `!perms.canSeeFinancialReports`:
- Hide any report sections/tabs labelled as financial: Revenue, MRR Trends, Contract Value, Cost Analysis, Billing
- All IT operational report sections remain: Ticket Volume, Resolution Time, Project Completion, Client Ticket Breakdown, Team Workload
- Filtering, date ranges, drill-down, and export all remain fully available for the visible sections

Implementation: wrap each financial section in a conditional on `perms.canSeeFinancialReports`.

---

## Step 13 — API Route Audit

Ensure every write endpoint enforces role at the API level — UI hiding alone is not enough.

| Endpoint | Current Guard | Required Change |
|---|---|---|
| `PUT /api/team/:id` | `withRole(["co-ceo", "director"])` | ✅ Already correct |
| `POST /api/clients` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `PUT /api/clients/:id` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `POST /api/projects` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `POST /api/projects/:id/tasks` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `PUT /api/projects/:id/tasks/:taskId` | Check current | Allow employee only if task.assignedToEmail matches |
| `POST /api/documents/upload` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `DELETE /api/documents/:id` | Check current | Add `withRole(["co-ceo", "director"])` if missing |
| `POST/PUT /api/tech-stack/*` | Check current | Add `withRole(["co-ceo", "director"])` if missing |

---

## Implementation Order

Build in this sequence — each step is independently deployable:

1. `permissions.ts` config — no UI changes, just the config
2. `usePermissions` hook — no UI changes
3. Sidebar filtering — immediately visible, low risk
4. Route guard component + apply to Leads/Connectors
5. Dashboard personal view (requires new API endpoint)
6. Team page UI cleanup (quick, mostly done)
7. Tickets read-only (just hiding stats)
8. Clients financial fields
9. Tech Stack cost fields + edit buttons
10. Documents upload/delete buttons
11. Projects own-task-only editing
12. Reports financial section hiding
13. API route audit + add missing role guards

---

## What Does NOT Change

- **AI Assistant** — no restrictions, employee accesses it fully
- **Settings** — no restrictions, employee sees their own profile only (same as everyone)
- **Notifications** — no restrictions
- **Auth flow** — no changes, middleware stays as-is
