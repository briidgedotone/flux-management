# Pending Tasks — Flux Suite

## Client Portal Tasks

### Task 1: Extend Atera sync to pull devices into infrastructure_items ✅ DONE
- **Codebase:** `Flux-client`
- **What:** Added `syncAteraDevices()` alongside ticket sync. Upserts agents into `infrastructure_items` with device type inference (server, workstation, firewall, etc.) from agent name/OS.
- **Sync route:** Atera sync now runs tickets + devices in parallel

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

### Task 5: Trigger critical ticket notification during Atera sync
- **Codebase:** `Flux-client`
- **What:** During `syncAteraTickets()`, when a new ticket with priority "Critical" is synced (INSERT, not UPDATE), create a notification + send email to management users.
- **How:** After the upsert, check if it was an INSERT (new ticket). If priority is Critical, call management portal's notification endpoint or directly insert into `management_notifications` table (shared DB).
- **Notify:** All users with role `co-ceo` or `director` and `is_active = true`
- **Notification:** type: `ticket_escalation`, title: "Critical: {subject}", link: `/tickets`
- **Email:** Use existing `ticketEscalationEmail` template via Graph API Mail.Send
- **Effort:** 2-3 hours

### Task 6: Wire marketing website contact form to management portal webhook ✅ DONE
- **Codebase:** `flux-app` (marketing website)
- **What:** Both contact and book-a-meeting forms now dual-submit to Google Sheets + management portal webhook
- **Env vars needed in flux-app:** `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_URL`, `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_SECRET`
- **Production URL:** Update `NEXT_PUBLIC_MANAGEMENT_WEBHOOK_URL` to production management portal URL after deployment

### Task 4: Production domain for client portal (Step 8.8)
- **Codebase:** `Flux-client`
- **What:** Configure `portal.flux.tech` DNS CNAME → Vercel
- **Blocked on:** Brandon adding DNS record
