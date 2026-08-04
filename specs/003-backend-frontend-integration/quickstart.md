# Quickstart: Planning Validation for Feature 003

This quickstart validates the plan and later integration work without touching the original database.

## Preconditions

- Branch: `003-backend-frontend-integration`.
- `frontend/` is the only official public UI.
- The root app is treated as backend/service only.
- Do not run seed, reset or migration against the original database.
- Use homologation for any DB-impacting validation.

## Read-Only Baseline Checks

```powershell
git status --short --branch
rg --files frontend\src\lib\data frontend\src\routes app lib prisma __tests__
```

## Issue 15 Baseline

Snapshot recorded on 2026-07-25 before changing the feature 003
documentation:

| Check | Evidence | Result |
|-------|----------|--------|
| Branch | `git status --short --branch` | `003-backend-frontend-integration`, tracking `origin/003-backend-frontend-integration` |
| Working tree | `git status --short --branch` | Clean before Issue #15 documentation changes |
| Baseline commit | `git rev-parse HEAD` | `5119f44a1f43094a8cf08dc1a460eda0e0e0e23a` |
| Active feature | `.specify/feature.json` | `specs/003-backend-frontend-integration` |
| Preserved stash | `git stash list` | `stash@{0}: On integrar-frontend-lovable: pre-003-local-speckit-state-do-not-apply` |
| Official frontend | `frontend/package.json` | TanStack Start/Vite app exists in `frontend/` |
| Real backend | root `package.json`, `app/api/`, `lib/`, `prisma/` | Next.js, NextAuth, Prisma and PostgreSQL service exists at the repository root |
| Historical frontend | `legacy/frontend-antigo/` | Preserved as history only; no feature 003 diff at this baseline |
| Feature 001 T104 | `specs/001-animal-adoption-management/tasks.md:260` | Pending as `- [ ] T104`; file was read only |
| Original database | command history for this task | No seed, reset, migration or database command executed |

The preserved stash must not be applied or deleted as part of feature 003 work.
After Issue #15, the only expected working-tree changes are feature 003
documentation owned by Pedro/Codex.

## Backend Validation Commands

Run when the environment is configured and no command would mutate the original DB:

```powershell
npm test
npm run typecheck
npm run lint
npm run prisma:validate
npm run build
```

Do not run these against the original database as part of planning:

```powershell
npm run prisma:migrate
npm run prisma:seed
prisma migrate reset
```

## Frontend Validation Commands

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

## First Delivery Checklist

- Audit covers every `frontend/src/lib/data/*.ts` module.
- Matrix covers every primary route in `frontend/src/routes/`.
- Matrix maps each flow to existing backend source files or an explicit gap.
- HTTP contract inventory exists for every flow and does not claim unimplemented endpoints as existing.
- Feature 002 health/dashboard/chat scenarios are audited before they are marked complete.
- No mocks/localStorage are removed before a real flow works.
- No Prisma/PostgreSQL access exists in `frontend/`.
- No `legacy/frontend-antigo/` functionality is added.

## Definition of Done Per Flow

A flow reaches `flow complete` only when:

1. HTTP contract is documented.
2. Backend is implemented and validated.
3. Frontend consumes real data.
4. Mocks, fictitious data and localStorage for that flow are removed.
5. Acceptance criteria and tests pass.

## SC-006 Homologation Checklist

Run this checklist only against an isolated homologation database. Never run a
seed, reset, or migration against the original database. Record one row per
small flow; a selected flow passes SC-006 only when its elapsed time is under
three minutes and the evidence reference is reproducible without containing a
password, token, cookie, private health document, or screening answer.

### Representative Accounts

| Alias | Required role/state | Purpose |
|-------|---------------------|---------|
| `H-ADOPTER` | Active adopter with completed screening | Favorites, requests, profile, and active/archived chat |
| `H-ADOPTER-NO-SCREENING` | Active adopter without completed screening | Screening-required request guard |
| `H-ORG` | Active organization owning homologation animals | Animal, health, request, dashboard, document, and chat flows |
| `H-FOSTER` | Active independent foster owning a homologation animal | Ownership and editable-profile checks |
| `H-ADMIN` | Active admin | Account list and activation/deactivation |
| `H-INACTIVE` | Inactive non-admin account | Inactive-account login/session block |

Store account identifiers and credentials only in the isolated environment;
do not write them in this repository or in evidence.

### Evidence Template

| Flow | Role | Started at | Finished at | Elapsed | Environment | Result | Evidence reference |
|------|------|------------|-------------|---------|-------------|--------|--------------------|
| Example | `H-ADOPTER` | ISO-8601 timestamp | ISO-8601 timestamp | `mm:ss` | Isolated homologation identifier | Pass/Fail | Test run, screenshot, or log reference without secrets |

### SC-006 Recorded Run — 2026-08-04

Environment: disposable PostgreSQL 16 container on an isolated localhost port;
Next.js backend plus official Vite frontend; all application calls crossed the
frontend same-origin `/api` proxy with real NextAuth cookies. The run began at
`2026-08-04T22:55:30.359Z`. Detailed request output remained local and contained
no password, token, cookie, private document, or screening answer.

| Flow | Role | Elapsed | Result | Evidence reference |
|------|------|---------|--------|--------------------|
| Authentication, reload, logout, 401 and inactive block | `H-ADOPTER`, `H-INACTIVE` | `00:00.748` | Pass | Real cookie/session HTTP round-trip |
| Public showcase filter and detail | Public | `00:00.344` | Pass | Public DTO HTTP round-trip |
| Editable profiles | `H-ADOPTER`, `H-ORG`, `H-FOSTER` | `00:01.147` | Pass | PATCH plus fresh GET for all roles |
| Screening to request | `H-ADOPTER`, `H-ADOPTER-NO-SCREENING` | `00:01.825` | Pass | Guard, triage and persisted request |
| Responsible request decision and privacy | `H-ORG`, foreign owner | `00:00.347` | Pass | Owner decision plus foreign-owner block |
| Animal create/edit and fresh read | `H-ORG` | `00:00.655` | Pass | Protected persisted animal round-trip; photo flow previously certified by T073 |
| Basic health create/read/delete | `H-ORG` | `00:00.979` | Pass | Protected health round-trip |
| CONSULTA completion without history fact | `H-ORG` | `00:04.920` | Pass | Agenda completion plus history verification |
| Operational dashboard and role block | `H-ORG`, wrong role | `00:01.524` | Pass | Scoped indicators and authorization block |
| Health-document privacy | `H-ORG`, foreign owner | `00:09.474` | Pass | Private metadata read and foreign-owner block |
| Real health-document provider lifecycle | `H-ORG` | `00:07.300` | Pass | UploadThing upload, list, open and delete |
| Active chat to archived read-only | `H-ADOPTER`, `H-ORG` | `00:11.042` | Pass | Send/read, adoption completion and archived 409 |
| Administration deactivate/reactivate | `H-ADMIN`, `H-INACTIVE` | `00:03.800` | Pass | Safe DTO, session/login block and reactivation |

All rows completed under the three-minute SC-006 limit. Only the disposable
database received fixtures or writes; the original database was not contacted.

### Timed Small Flows

1. **Authentication:** login as `H-ADOPTER`, reload a protected page, logout,
   confirm 401 without session, then confirm `H-INACTIVE` is blocked.
2. **Public showcase:** open the showcase, apply species/breed filters, and open
   a real animal detail without exposing private owner or health data.
3. **Editable profiles:** edit and reload the profiles of `H-ADOPTER`, `H-ORG`,
   and `H-FOSTER`; confirm immutable CPF/CNPJ fields remain unchanged.
4. **Screening to request:** complete screening as `H-ADOPTER`, create a request,
   and confirm `H-ADOPTER-NO-SCREENING` is blocked from requesting.
5. **Responsible request decision:** as the owner, review only the allowed
   screening DTO and approve or refuse a request; confirm a foreign owner cannot
   access it.
6. **Animal management:** create or edit a homologation animal and confirm a
   fresh read retains the values and required photo state.
7. **Basic health:** create and delete a real non-`CONSULTA` health record and
   confirm ownership enforcement.
8. **Operational dashboard:** review owner-scoped indicators and follow one
   drill-down without seeing another owner's data.
9. **Health documents:** upload/list/open/delete an internal homologation
   document and confirm an adopter or foreign owner cannot access it.
10. **Chat:** after approval, open the same conversation as adopter and owner,
    send/read a message, conclude the adoption, and confirm the archived history
    remains visible while sends are rejected.
11. **Administration:** as `H-ADMIN`, list safe user DTOs, deactivate a
    homologation account, confirm its access is blocked, then reactivate it.

### Completion Rules

- Stop a flow timer when its persisted result is visible after a fresh read.
- Record failures as failures; do not restart a timer to hide an error.
- Clear browser storage between selected persistence checks and confirm real
  data remains available from the backend.
- T082 and T106 may advance from `frontend integrated` to `flow complete` only
  from the relevant successful rows above.
- T122 remains pending when an isolated database, representative account, or
  reproducible evidence is unavailable.
