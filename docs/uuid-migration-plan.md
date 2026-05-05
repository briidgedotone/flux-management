# UUID Migration — COMPLETED

> **Executed:** April 25, 2026
> **Status:** Done on local database. Production pending.

## UUID Mapping (local DB)

### Organizations
| Old ID | New ID | Name |
|---|---|---|
| `a0000000-0000-0000-0000-000000000001` | `5fac61fa-d9e0-4cca-acda-434094009ca6` | Flux Technologies |
| `a0000000-0000-0000-0000-000000000002` | `a035b3cd-7f53-44e9-ab94-46ff68871cf9` | Armada Analytics |
| `a0000000-0000-0000-0000-000000000003` | `8f4b5e20-2ea8-4293-8878-3d04fd1f0fe0` | OnPoint CFO |

### Users
| Old ID | New ID | User |
|---|---|---|
| `b0000000-0000-0000-0000-000000000001` | `3a2338ab-1852-4159-9c51-9474ef409715` | Brandon Devier |
| `b0000000-0000-0000-0000-000000000002` | `c565cdb2-284b-4c39-bdcd-9d967cbfe901` | Cameron Cannon |
| `b0000000-0000-0000-0000-000000000003` | `d6f9a017-ff5b-4b23-81b9-6221d3f13313` | Zack Devier |
| `b0000000-0000-0000-0000-000000000004` | `49bf8dea-648d-4907-a46f-16a2b7b3381d` | Sarah Mitchell |
| `b0000000-0000-0000-0000-000000000005` | `0476157a-00fe-4497-9cb1-b88453cbba3f` | Mike Reynolds |
| `b0000000-0000-0000-0000-000000000099` | `6c09f98b-eafa-406c-b880-80917240d1dc` | Sourav (Dev) |

### Not Changed
| ID | Reason |
|---|---|
| `00000000-0000-0000-0000-000000000099` | Test org — intentionally well-known |
| `00000000-0000-0000-0000-000000000001` to `...0004` | Test users — intentionally well-known |

## What Was Done
1. Backed up local database (3.1MB)
2. Ran migration with FK triggers disabled (`SET session_replication_role = replica`)
3. Updated ~2,200 rows across 24 tables
4. Updated client portal seed script (`Flux-client/src/lib/db/seed.ts`)
5. Updated management portal seed script (`flux-management/src/lib/db/seed.ts`)
6. Verified: 154 tests pass, both portals build, Zod `.uuid()` validates new IDs

## Production
Same migration needs to be run on production database. The UUIDs will be DIFFERENT on production (gen_random_uuid() generates new ones each run). Production seed scripts will need updating with the production mapping.
