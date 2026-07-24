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
