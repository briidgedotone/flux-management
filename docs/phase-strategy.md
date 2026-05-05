# Phase Strategy & Implementation Roadmap

> Last updated: 2026-03-18
> Status: Pre-implementation — all phases pending

---

## Current State

Frontend is complete with mock data. Backend implementation has not started. All documentation is ready:
- `backend-plan.md` — Full architecture with 13 sections
- `implementation-plan.md` — 65 steps with 72 rules, commit messages, doc references
- `security-and-operations.md` — Security rules with 13 test data isolation rules
- `testing-plan.md` — Test strategy with test org approach
- `external-api-safety.md` — API safety guidelines
- `CLAUDE.md` — Project instruction manual

---

## What We Have Now

| Resource | Status | Notes |
|----------|--------|-------|
| Local PostgreSQL | Available | Shared with client portal, has real data |
| Atera API Key | Available | Already in client portal's `.env.local` |
| Azure AD Tenant | Available | Same tenant as client portal |
| Azure AD Admin Account | Available | `development@flux.tech` from client portal work |
| Anthropic API Key | Available | Already in client portal's `.env.local` |
| Graph API (Read) | Available | `Tasks.Read.All`, `Sites.Read.All`, `Mail.Send` already consented |
| Client Portal Codebase | Available | Reference for patterns, can adapt auth/session/response code |

## What We're Waiting For

| Blocker | What It Unblocks | Who Provides It | Impact If Delayed |
|---------|-----------------|-----------------|-------------------|
| Management Azure AD App Registration | Phase 2 (Auth) — management-specific app | Us (we create it) using existing admin | None — we can do this ourselves |
| `Tasks.ReadWrite.All` permission | Step 5.1 (Planner write-back) | Brandon — admin consent needed | Can build everything else, Planner writes are Phase 5 only |
| `Group.Read.All` permission | Planner plan discovery | Brandon — admin consent needed | Same as above |
| Azure subscription for management | Phase 8 (Deployment) | Brandon — already has it, needs new RG | Can develop fully locally, deploy later |
| Production domain | Phase 8 (Deployment) | Brandon — e.g., `management.fluxtech.com` | Only needed at deploy time |

---

## Why This Order

Unlike the client portal (which had multiple rounds of blocked credentials), the management portal is in a better position:

1. **We already have most credentials** — Atera key, Azure AD tenant, Anthropic key, Graph API read permissions are all available from the client portal work.
2. **The shared database already exists** — 17 tables with real data. We just add 7 tables.
3. **Auth patterns are proven** — We can adapt the client portal's Azure AD/JWT code.
4. **Only Planner write-back needs new permissions** — Everything else works with what we have.

**Principle:** Build everything linearly (Phase 0 → 8). The only step that might be blocked is 5.1 (Planner write-back), and we can skip it temporarily if `Tasks.ReadWrite.All` isn't consented yet.

---

## Implementation Order

### Can Build Now (No Blockers)

**Phase 0 — Pre-Implementation Setup**
- All local work: branch, deps, env, scaffold, types, test infrastructure
- No external dependencies

**Phase 1 — Database Foundation**
- Connects to existing local PostgreSQL
- Runs migrations to add 7 new tables
- Seeds management users and client profiles
- No external dependencies

**Phase 2 — Authentication**
- Create a new Azure AD app registration (`flux-management-dev`) — we have admin access
- Adapt JWT/session code from client portal
- Build middleware (`withManagementAuth`, `withRole`)
- Wire login page
- **Requires:** Azure AD admin account (we have it)

**Phase 3 — Database Query Modules**
- All pure PostgreSQL queries — no external APIs
- Build all 9 query modules (clients, tickets, projects, team, reports, ai, notifications, contact-submissions, activity-log)
- No external dependencies

**Phase 4 — API Routes**
- Build all 38 API endpoints
- All use existing database + auth middleware
- No external dependencies (API routes call query modules, not external APIs)

**Phase 5 — Integrations (mostly unblocked)**
- **5.2 Claude AI context builder** — we have the Anthropic key ✅
- **5.3 Email notification sender** — we have Mail.Send permission ✅
- **5.4 Contact form webhook** — pure code, no external dependency ✅
- **5.1 Planner write-back** — ⚠️ needs `Tasks.ReadWrite.All` consent

**Phase 6 — Frontend Integration**
- All frontend wiring — replaces mock data with API hooks
- No external dependencies (calls our own API routes)

**Phase 7 — Security Hardening**
- Rate limiting, error handling, audit logging, test suites
- No external dependencies

### Blocked Until Credentials Arrive

**Phase 5.1 — Planner Write-Back**
- Needs: `Tasks.ReadWrite.All` + admin consent from Brandon
- Workaround: Build the code, test with mocks, wire up when permission arrives
- Impact: Task create/update/delete in management portal will save to DB only (not Planner) until permission is granted. Acceptable for dev/testing.

**Phase 8 — Deployment**
- Needs: Azure subscription access for management portal resources
- Needs: Production domain name
- Workaround: None — deployment requires infrastructure. But everything else can be built and tested locally.

---

## Recommended Approach

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (skip 5.1 if blocked) → Phase 6 → Phase 7
                                                                                                  ↓
                                                              When Tasks.ReadWrite.All arrives → Step 5.1
                                                              When Azure subscription ready → Phase 8
```

**Build linearly. Skip only Step 5.1 if Planner write permission isn't ready. Everything else is unblocked.**

---

## Action Items for Brandon

Email Brandon requesting:

1. **`Tasks.ReadWrite.All`** application permission + admin consent on existing Azure AD app (or we'll request it on the new management app registration)
2. **`Group.Read.All`** application permission + admin consent (if not already granted)
3. **Azure resource group** for management portal: `flux-management-prod-rg` (following naming convention)
4. **Production domain** decision: `management.fluxtech.com` or similar

These are not urgent — we can build Phases 0–7 without them. But requesting early avoids delays at deployment time.

---

## Key Files Reference

| Category | Key Files |
|---|---|
| Implementation plan | `docs/implementation-plan.md` (65 steps, 72 rules) |
| Architecture | `docs/backend-plan.md` (13 sections) |
| Security rules | `docs/security-and-operations.md` (11 sections) |
| Test strategy | `docs/testing-plan.md` |
| API safety | `docs/external-api-safety.md` |
| Project instructions | `CLAUDE.md` |
| Client portal reference | `../Flux-client/` (adapt patterns, don't copy blindly) |
