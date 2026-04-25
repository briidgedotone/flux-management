# UUID Migration Plan — Replace Predictable IDs with Random UUIDs

> **Goal:** Replace all `a0000000-...` and `b0000000-...` seed IDs with proper `gen_random_uuid()` values across both portals and production.
>
> **Why:** Current IDs are predictable, non-RFC-4122-compliant, and fail strict UUID validation (Zod `.uuid()`).
>
> **Risk level:** HIGH — touches primary keys across 24 tables, 2 portals, production database, Vercel env vars.

---

## Scope

### IDs to Replace

**3 Organization IDs:**

| Current ID | Name |
|---|---|
| `a0000000-0000-0000-0000-000000000001` | Flux Technologies |
| `a0000000-0000-0000-0000-000000000002` | Armada Analytics |
| `a0000000-0000-0000-0000-000000000003` | OnPoint CFO & Controller Services |

**6 User IDs:**

| Current ID | User |
|---|---|
| `b0000000-0000-0000-0000-000000000001` | Brandon Devier (co-ceo) |
| `b0000000-0000-0000-0000-000000000002` | Cameron Cannon (director) |
| `b0000000-0000-0000-0000-000000000003` | Zack Devier (co-ceo) |
| `b0000000-0000-0000-0000-000000000004` | Sarah Mitchell (client, Armada) |
| `b0000000-0000-0000-0000-000000000005` | Mike Reynolds (client, OnPoint) |
| `b0000000-0000-0000-0000-000000000099` | Sourav Dev (admin) |

**NOT changing (keep as-is):**

| Current ID | Why |
|---|---|
| `00000000-0000-0000-0000-000000000099` | Test org — intentionally well-known for test isolation |
| `00000000-0000-0000-0000-000000000001` to `...0004` | Test users — intentionally well-known for test constants |

### Tables Affected (FK chains)

**Organization ID referenced by 18 tables:**
1. `organizations` — PRIMARY KEY
2. `users` — `organization_id`
3. `tickets` — `organization_id`
4. `ticket_activities` — `organization_id`
5. `ticket_attachments` — `organization_id`
6. `projects` — `organization_id`
7. `project_tasks` — `organization_id`
8. `project_assignees` — `organization_id`
9. `documents` — `organization_id`
10. `software_subscriptions` — `organization_id`
11. `infrastructure_items` — `organization_id`
12. `cloud_services` — `organization_id`
13. `ai_conversations` — `organization_id`
14. `ai_messages` — `organization_id`
15. `notifications` — `organization_id`
16. `connector_statuses` — `organization_id`
17. `sync_logs` — `organization_id`
18. `client_profiles` — `organization_id` (UNIQUE)
19. `activity_log` — `organization_id`

**User ID referenced by 7 tables:**
1. `users` — PRIMARY KEY
2. `ai_conversations` — `user_id`
3. `notifications` — `user_id`
4. `management_notifications` — `user_id`
5. `team_members` — `user_id` (UNIQUE)
6. `internal_notes` — `author_id`
7. `contact_form_submissions` — `reviewed_by`
8. `activity_log` — `user_id`

### Row Counts

| Table | Rows | Has org_id | Has user_id |
|---|---|---|---|
| organizations | 4 | PK | — |
| users | 10 | Yes | PK |
| tickets | 1,799 | Yes | — |
| ticket_activities | 0 | Yes | — |
| ticket_attachments | 0 | Yes | — |
| projects | 7 | Yes | — |
| project_tasks | 32 | Yes | — |
| project_assignees | 14 | Yes | — |
| documents | 235 | Yes | — |
| software_subscriptions | 0 | Yes | — |
| infrastructure_items | 0 | Yes | — |
| cloud_services | 0 | Yes | — |
| ai_conversations | 13 | Yes | Yes |
| ai_messages | 60 | Yes | — |
| notifications | 3 | Yes | Yes |
| connector_statuses | 12 | Yes | — |
| sync_logs | 34 | Yes | — |
| client_profiles | 3 | Yes | — |
| team_members | 6 | — | Yes |
| internal_notes | 2 | — | Yes (author_id) |
| activity_log | 3 | Yes | Yes |
| management_notifications | 6 | — | Yes |
| contact_form_submissions | 4 | — | Yes (reviewed_by) |
| report_snapshots | 4 | — | — |

---

## Plan

### Pre-Migration

#### Step M.0: Backup
- [ ] Dump local database: `pg_dump fluxdb > backup_pre_uuid_migration.sql`
- [ ] Dump production database (if running there)
- [ ] Record current row counts for all tables (for post-migration verification)

#### Step M.1: Generate new UUIDs
- [ ] Generate 3 random UUIDs for organizations
- [ ] Generate 6 random UUIDs for users
- [ ] Create a mapping file:

```typescript
// uuid-mapping.ts
export const ORG_MAP = {
  "a0000000-0000-0000-0000-000000000001": "<new-uuid-1>", // Flux Technologies
  "a0000000-0000-0000-0000-000000000002": "<new-uuid-2>", // Armada Analytics
  "a0000000-0000-0000-0000-000000000003": "<new-uuid-3>", // OnPoint CFO
};

export const USER_MAP = {
  "b0000000-0000-0000-0000-000000000001": "<new-uuid-4>", // Brandon Devier
  "b0000000-0000-0000-0000-000000000002": "<new-uuid-5>", // Cameron Cannon
  "b0000000-0000-0000-0000-000000000003": "<new-uuid-6>", // Zack Devier
  "b0000000-0000-0000-0000-000000000004": "<new-uuid-7>", // Sarah Mitchell
  "b0000000-0000-0000-0000-000000000005": "<new-uuid-8>", // Mike Reynolds
  "b0000000-0000-0000-0000-000000000099": "<new-uuid-9>", // Sourav Dev
};
```

### Migration Script

#### Step M.2: Write migration `007_replace_predictable_uuids.sql`
- [ ] Wrap entire migration in `BEGIN` / `COMMIT` transaction
- [ ] Disable FK checks is not possible in PostgreSQL — use `SET CONSTRAINTS ALL DEFERRED` at start
- [ ] Update in dependency order (parents first, then children):

```sql
BEGIN;
SET CONSTRAINTS ALL DEFERRED;

-- Generate new UUIDs (store in temp table for referential integrity)
CREATE TEMP TABLE uuid_map_orgs (old_id UUID, new_id UUID);
INSERT INTO uuid_map_orgs VALUES
  ('a0000000-0000-0000-0000-000000000001', gen_random_uuid()),
  ('a0000000-0000-0000-0000-000000000002', gen_random_uuid()),
  ('a0000000-0000-0000-0000-000000000003', gen_random_uuid());

CREATE TEMP TABLE uuid_map_users (old_id UUID, new_id UUID);
INSERT INTO uuid_map_users VALUES
  ('b0000000-0000-0000-0000-000000000001', gen_random_uuid()),
  ('b0000000-0000-0000-0000-000000000002', gen_random_uuid()),
  ('b0000000-0000-0000-0000-000000000003', gen_random_uuid()),
  ('b0000000-0000-0000-0000-000000000004', gen_random_uuid()),
  ('b0000000-0000-0000-0000-000000000005', gen_random_uuid()),
  ('b0000000-0000-0000-0000-000000000099', gen_random_uuid());

-- Step 1: Update organizations PK
UPDATE organizations SET id = m.new_id FROM uuid_map_orgs m WHERE organizations.id = m.old_id;

-- Step 2: Update users PK + organization_id FK
UPDATE users SET organization_id = m.new_id FROM uuid_map_orgs m WHERE users.organization_id = m.old_id;
UPDATE users SET id = m.new_id FROM uuid_map_users m WHERE users.id = m.old_id;

-- Step 3: Update all org_id FKs (18 tables)
UPDATE tickets SET organization_id = m.new_id FROM uuid_map_orgs m WHERE tickets.organization_id = m.old_id;
UPDATE ticket_activities SET organization_id = m.new_id FROM uuid_map_orgs m WHERE ticket_activities.organization_id = m.old_id;
UPDATE ticket_attachments SET organization_id = m.new_id FROM uuid_map_orgs m WHERE ticket_attachments.organization_id = m.old_id;
UPDATE projects SET organization_id = m.new_id FROM uuid_map_orgs m WHERE projects.organization_id = m.old_id;
UPDATE project_tasks SET organization_id = m.new_id FROM uuid_map_orgs m WHERE project_tasks.organization_id = m.old_id;
UPDATE project_assignees SET organization_id = m.new_id FROM uuid_map_orgs m WHERE project_assignees.organization_id = m.old_id;
UPDATE documents SET organization_id = m.new_id FROM uuid_map_orgs m WHERE documents.organization_id = m.old_id;
UPDATE software_subscriptions SET organization_id = m.new_id FROM uuid_map_orgs m WHERE software_subscriptions.organization_id = m.old_id;
UPDATE infrastructure_items SET organization_id = m.new_id FROM uuid_map_orgs m WHERE infrastructure_items.organization_id = m.old_id;
UPDATE cloud_services SET organization_id = m.new_id FROM uuid_map_orgs m WHERE cloud_services.organization_id = m.old_id;
UPDATE ai_conversations SET organization_id = m.new_id FROM uuid_map_orgs m WHERE ai_conversations.organization_id = m.old_id;
UPDATE ai_messages SET organization_id = m.new_id FROM uuid_map_orgs m WHERE ai_messages.organization_id = m.old_id;
UPDATE notifications SET organization_id = m.new_id FROM uuid_map_orgs m WHERE notifications.organization_id = m.old_id;
UPDATE connector_statuses SET organization_id = m.new_id FROM uuid_map_orgs m WHERE connector_statuses.organization_id = m.old_id;
UPDATE sync_logs SET organization_id = m.new_id FROM uuid_map_orgs m WHERE sync_logs.organization_id = m.old_id;
UPDATE client_profiles SET organization_id = m.new_id FROM uuid_map_orgs m WHERE client_profiles.organization_id = m.old_id;
UPDATE activity_log SET organization_id = m.new_id FROM uuid_map_orgs m WHERE activity_log.organization_id = m.old_id;

-- Step 4: Update all user_id FKs (7 tables)
UPDATE ai_conversations SET user_id = m.new_id FROM uuid_map_users m WHERE ai_conversations.user_id = m.old_id;
UPDATE notifications SET user_id = m.new_id FROM uuid_map_users m WHERE notifications.user_id = m.old_id;
UPDATE management_notifications SET user_id = m.new_id FROM uuid_map_users m WHERE management_notifications.user_id = m.old_id;
UPDATE team_members SET user_id = m.new_id FROM uuid_map_users m WHERE team_members.user_id = m.old_id;
UPDATE internal_notes SET author_id = m.new_id FROM uuid_map_users m WHERE internal_notes.author_id = m.old_id;
UPDATE contact_form_submissions SET reviewed_by = m.new_id FROM uuid_map_users m WHERE contact_form_submissions.reviewed_by = m.old_id;
UPDATE activity_log SET user_id = m.new_id FROM uuid_map_users m WHERE activity_log.user_id = m.old_id;

-- Step 5: Output the mapping for updating code/env vars
SELECT 'ORG: ' || old_id || ' → ' || new_id FROM uuid_map_orgs;
SELECT 'USER: ' || old_id || ' → ' || new_id FROM uuid_map_users;

DROP TABLE uuid_map_orgs;
DROP TABLE uuid_map_users;

COMMIT;
```

### Post-Migration Code Updates

#### Step M.3: Update client portal seed script
- [ ] `Flux-client/src/lib/db/seed.ts` — replace all `a0000000-...` and `b0000000-...` constants with the new UUIDs
- [ ] Verify build: `cd Flux-client && npm run build`

#### Step M.4: Update management portal seed script
- [ ] `flux-management/src/lib/db/seed.ts` — replace all `a0000000-...` and `b0000000-...` references with new UUIDs
- [ ] Verify build: `npm run build`

#### Step M.5: Update management portal test constants
- [ ] `flux-management/src/__tests__/test-constants.ts` — test IDs (`00000000-...`) stay unchanged (they're intentionally predictable for test isolation)
- [ ] Verify no test code references `a0000000-...` or `b0000000-...` IDs
- [ ] Run tests: `npm test` — all 154 should pass (test org/users are NOT being migrated)

#### Step M.6: Update dev-login route
- [ ] `flux-management/src/app/api/auth/dev-login/route.ts` — uses email lookup, not ID → no change needed
- [ ] `Flux-client/src/app/api/auth/dev-login/route.ts` — same, email lookup → no change needed
- [ ] Verify dev-login still works after migration

#### Step M.7: Update Vercel environment variables
- [ ] Check if any Vercel env vars reference the old IDs
- [ ] Update if needed (unlikely — env vars store secrets, not IDs)

#### Step M.8: Update `.env.local` files
- [ ] Check both portals' `.env.local` for hardcoded IDs
- [ ] Update if needed

### Verification

#### Step M.9: Verify local database
- [ ] All organizations have random UUIDs: `SELECT id, name FROM organizations`
- [ ] All users have random UUIDs: `SELECT id, email FROM users`
- [ ] Row counts match pre-migration counts (no data lost)
- [ ] No `a0000000-...` or `b0000000-...` IDs remain: `SELECT id FROM organizations WHERE id::text LIKE 'a0000000%'` → 0 rows
- [ ] Test org and test users unchanged: `SELECT id FROM organizations WHERE id::text LIKE '00000000%'` → 1 row
- [ ] FK integrity: no orphaned rows in any child table

#### Step M.10: Verify applications
- [ ] Client portal: `cd Flux-client && npm run build && npm run dev`
  - [ ] Dev-login works
  - [ ] Dashboard loads with real data
  - [ ] Tickets page loads
  - [ ] No broken links or missing data
- [ ] Management portal: `cd flux-management && npm run build && npm run dev`
  - [ ] Dev-login works
  - [ ] Dashboard shows real KPIs
  - [ ] Clients page shows Armada + OnPoint (not Flux Technologies)
  - [ ] Tickets page shows 1,700+ tickets
  - [ ] Team page shows Brandon, Zack, Cameron
  - [ ] All 154 tests pass: `npm test`
- [ ] Zod `.uuid()` validation now passes for all IDs

#### Step M.11: Verify Zod validation
- [ ] Restore `.uuid()` in all validator files (revert the fix we would have done with Option A)
- [ ] Build passes
- [ ] Client detail page `/clients/[real-uuid]` loads correctly

### Production Migration

#### Step M.12: Run on production
- [ ] Take a production database backup first
- [ ] Run the same migration SQL against production PostgreSQL
- [ ] Record the new UUID mapping from the SELECT output
- [ ] Update production seed scripts with new UUIDs
- [ ] Update Vercel env vars if needed
- [ ] Verify client portal on production
- [ ] Verify management portal on production (when deployed)

---

## Rollback Plan

If anything goes wrong:
1. The migration is wrapped in a transaction — if any step fails, entire migration rolls back
2. If migration succeeds but apps break: restore from `backup_pre_uuid_migration.sql`
3. If production breaks: restore from production backup

---

## Order of Execution

```
1. Backup local DB
2. Run migration SQL on local DB
3. Record new UUID mapping
4. Update Flux-client seed script
5. Update flux-management seed script
6. Verify both portals locally (build + dev server + tests)
7. Commit all changes
8. --- PRODUCTION (later) ---
9. Backup production DB
10. Run migration SQL on production DB
11. Update Vercel env vars if needed
12. Verify production
```

---

## Estimated Impact

- **Migration SQL:** ~40 UPDATE statements across 24 tables, ~2,200 rows updated
- **Code changes:** 2 seed scripts (new UUID constants)
- **Test changes:** None (test IDs unchanged)
- **Downtime:** None for local. Production: seconds (single transaction)
- **Risk:** Low if done in transaction. Rollback is instant via backup.
