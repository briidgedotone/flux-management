# Pending Tasks — Flux Suite

## Client Portal Tasks

### Task 1: Extend Atera sync to pull devices into infrastructure_items
- **Codebase:** `Flux-client`
- **What:** The Atera API client already has `getAgents()` function. Need to write a sync function that pulls agents/devices and upserts into `infrastructure_items` table.
- **Why:** Management portal's tech stack page reads from `infrastructure_items` but it's empty because no sync populates it.
- **Files to modify:**
  - `src/lib/integrations/atera/sync.ts` — add `syncAteraDevices()` function
  - `src/app/api/sync/atera/route.ts` — call the new sync alongside ticket sync
- **Pattern:** Follow `syncAteraTickets()` — fetch all agents, map fields, upsert with ON CONFLICT
- **Effort:** 2-3 hours

### Task 2: Extend SharePoint sync to pull software/cloud data
- **Codebase:** `Flux-client`
- **What:** If clients have software subscription lists or cloud service inventories in SharePoint, sync them into `software_subscriptions` and `cloud_services` tables.
- **Depends on:** Brandon confirming if this data exists in SharePoint
- **Effort:** 4-6 hours (depends on SharePoint structure)

### Task 3: Azure Functions for scheduled sync (Step 4.8)
- **Codebase:** `Flux-client`
- **What:** Deploy timer triggers for automated sync (Atera 5m, Planner 15m, SharePoint 30m)
- **Status:** Still pending from original client portal implementation plan
- **Effort:** 4-6 hours

### Task 4: Production domain for client portal (Step 8.8)
- **Codebase:** `Flux-client`
- **What:** Configure `portal.flux.tech` DNS CNAME → Vercel
- **Blocked on:** Brandon adding DNS record
