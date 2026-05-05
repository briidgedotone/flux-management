# Pending Tasks — Flux Suite

## Client Portal Tasks

### Task 1: Extend Atera sync to pull devices into infrastructure_items ✅ DONE
- **Codebase:** `Flux-client`
- **What:** Added `syncAteraDevices()` alongside ticket sync. Upserts agents into `infrastructure_items` with device type inference + hardware details (vendor, model, OS, memory, disk).
- **Sync route:** Atera sync now runs tickets + devices in parallel

### Task 2: Sync software subscriptions from Azure AD groups ✅ DONE
- **Codebase:** `Flux-client`
- **What:** SharePoint has no structured software data. Instead, Azure AD security groups (e.g., "Adobe - Users", "Dashlane Users") track software licenses. Syncs group names + member counts into `software_subscriptions`.
- **Also:** Device sync now enriched with hardware details (vendor, model, OS, processor, memory, disk) via migration 006.
- **Note:** Software groups are tenant-wide (Flux manages for all clients), assigned to Flux org.

### Task 3: Scheduled sync via Vercel Cron ✅ DONE
- **Codebase:** `Flux-client`
- **What:** Vercel Cron config in `vercel.json` — Atera every 1 min, Planner every 5 min, SharePoint every 5 min
- **Activates on deploy:** Cron jobs start running once the client portal is deployed to Vercel

### Task 5: Trigger critical ticket notification during Atera sync ✅ DONE
- **Codebase:** `Flux-client`
- **What:** During Atera sync, new Critical tickets trigger in-app notifications (management_notifications table) + email alerts to all co-ceo/director users
- **Non-blocking:** Notification failures don't break the sync

### Task 6: Wire marketing website contact form to management portal webhook ✅ DONE
- **Codebase:** `flux-app` (marketing website)
- **What:** Both contact and book-a-meeting forms now dual-submit to Google Sheets + management portal webhook
- **Env vars needed in flux-app:** `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_URL`, `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_SECRET`
- **Production URL:** Update `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_URL` to production management portal URL after deployment

### Task 4: Production domain for client portal (Step 8.8)
- **Codebase:** `Flux-client`
- **What:** Configure `portal.flux.tech` DNS CNAME → Vercel
- **Blocked on:** Brandon adding DNS record

### Task 7: M365 license SKU sync (TBD)
- **Codebase:** `Flux-client`
- **What:** Sync Microsoft 365 license data (SKU names, consumed/total counts) from Graph API `/subscribedSkus` into `software_subscriptions`
- **Blocked on:** Brandon granting `Organization.Read.All` permission to the `flux-clientportal-dev` app registration in Azure AD
- **Also consider:** `User.Read.All` permission to resolve group member names (currently null due to insufficient privileges)
- **Effort:** 2-3 hours once permission is granted

### Task 8: Task create/edit/delete UI + Planner write-back (TBD)
- **Codebase:** `flux-management` (UI) + `flux-management` (API wiring)
- **PRD requirement:** U3, T2, T4, N3 — "Employees: create, delete, or complete tasks only"
- **Current state:**
  - API endpoints exist: `POST/PUT/DELETE /api/projects/{id}/tasks/{taskId}`
  - Planner write-back functions exist: `createPlannerTask`, `updatePlannerTask`, `deletePlannerTask` in `src/lib/integrations/graph/planner-write.ts`
  - Task assignment email notification wired on task creation
  - Plan IDs already stored in `organizations.planner_group_id` (Armada: 10 plans, OnPoint: 2 plans)
  - Project detail page shows tasks in Kanban board (read-only)
- **What's missing:**
  - "Add Task" form on project detail page (name, assignee, priority, due date)
  - Click-to-edit on task cards (change status, update details)
  - Delete button on task cards
  - Wire `createPlannerTask` / `updatePlannerTask` / `deletePlannerTask` calls in API routes (currently `// TODO`)
- **Permission:** `Tasks.ReadWrite.All` is ALREADY granted on `flux-management-dev` app. **NOT blocked on Brandon.**
- **Without write-back risk:** Tasks created/edited in portal would get overwritten by next Planner sync (every 5 min) since sync does `ON CONFLICT ... DO UPDATE`
- **Architecture context:**
  - Client portal syncs from Planner Premium via Dataverse (read-only, `dataverseGet` only)
  - Management portal has its own Graph token via `planner-write.ts` (separate from client portal's auth)
  - Dual-write pattern: DB write immediate + Planner write background/non-blocking
  - Projects come from Dataverse sync, not Graph Planner Basic — write-back needs to go to the same Dataverse/Planner Premium endpoint or Graph Planner
- **Effort:** 4-6 hours for UI + API wiring once permission is granted
- **Ask Brandon:**
  1. ~~Grant `Tasks.ReadWrite.All`~~ — Already granted on `flux-management-dev`
  2. Confirm if write-back should target Planner Premium (Dataverse) or Planner Basic (Graph API)
  3. Confirm which Plan ID to use per project when creating new tasks
