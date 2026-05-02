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

### Task 3: Azure Functions for scheduled sync (Step 4.8)
- **Codebase:** `Flux-client`
- **What:** Deploy timer triggers for automated sync (Atera 5m, Planner 15m, SharePoint 30m)
- **Status:** Still pending from original client portal implementation plan
- **Effort:** 4-6 hours

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
