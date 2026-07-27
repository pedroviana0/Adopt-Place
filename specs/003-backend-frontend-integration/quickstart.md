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
