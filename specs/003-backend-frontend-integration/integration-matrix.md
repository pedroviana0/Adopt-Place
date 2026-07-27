# Integration Matrix: Backend Frontend Integration

This document is the synchronization point between Pedro/Codex and
Arthur/Claude. It starts with the Issue #15 baseline and backend audit. It does
not claim that HTTP contracts or frontend integrations already exist.

## Ownership and Boundaries

- Pedro/Codex owns this matrix, backend evidence, HTTP contracts, security,
  validation, and `tasks.md`.
- Arthur/Claude owns audits and changes under the active `frontend/`.
- `frontend/` is the only official public interface.
- The repository root is the real backend/service and the only layer allowed to
  access Prisma or PostgreSQL.
- `legacy/frontend-antigo/` is historical only and receives no new
  functionality.
- A flow cannot advance beyond `audited` without evidence in its own row.

## Status Lifecycle

| Status | Minimum evidence |
|--------|------------------|
| `audited` | Current frontend behavior and current backend capability are recorded with real paths; gaps and risks are explicit. |
| `contract defined` | The HTTP method/path, auth mode, request and response DTOs, sensitive-field exclusions, errors, backend source, tests, and frontend dependency are documented. |
| `backend ready` | The documented backend contract is implemented and validated, including required authorization and critical-path tests. |
| `frontend integrated` | The official frontend consumes the real backend contract and the flow works without relying on its replaced mock path. |
| `flow complete` | Contract, backend, frontend, per-flow mock/localStorage removal, acceptance criteria, and tests all have recorded evidence. |

Statuses are sequential. Visual presence, seed data, localStorage, an internal
Server Action, or a Prisma query alone is not evidence of an integrated flow.

## Required Flow Row Schema

Every flow row added in T008-T014 must contain all fields below. Missing
evidence is recorded as a gap or pending decision, never as an invented
endpoint, model, or capability.

| Field | Required content |
|-------|------------------|
| Flow | Small, independently verifiable user flow |
| Frontend behavior | Current route, component, data module, mock/localStorage use, and observed behavior |
| Backend capability | Existing route, action, query, schema, permission, and test evidence |
| Source of truth | Existing Prisma entity, enum, relationship, constraint, or documented product rule |
| Known gap | Missing or unproven behavior, including pending product decisions |
| Risk | `low`, `medium`, `high`, or `critical`, with reason |
| Smallest next flow | Next result that can be validated independently |
| HTTP contract inventory | Contract group and evidence link; exact method/path only after definition |
| Responsible side | `backend`, `frontend`, or two related Issues |
| Related Issues | Separate backend/frontend Issue references or placeholders |
| Owner | Pedro for backend/contracts/security/specs/tasks/validation; Arthur for active frontend |
| Affected files or areas | Real paths only |
| Execution order | Backend contract before frontend consumption and mock removal |
| Dependencies | Task, Issue, contract, product decision, or homologation dependency |
| Acceptance criteria | Observable result and required authorization/privacy checks |
| Status | Exactly one lifecycle status defined above |
| Evidence | Tests, commands, review notes, or PR references supporting the status |

## Issue 15 Baseline

| Area | Evidence | Baseline result |
|------|----------|-----------------|
| Feature context | `.specify/feature.json` | Points to `specs/003-backend-frontend-integration` |
| Official frontend | `frontend/package.json` | TanStack Start/Vite app present; detailed module and route audit remains T004/T005 with Arthur |
| Real backend | root `package.json`, `app/api/`, `lib/`, `prisma/schema.prisma` | Next.js service with NextAuth, Prisma and PostgreSQL |
| Public interface rule | `spec.md` FR-004/FR-031 and `plan.md` | Only `frontend/` is accepted as public UI; root is service-only |
| Historical frontend | `legacy/frontend-antigo/` and `git diff origin/main...HEAD -- legacy/frontend-antigo` | Directory preserved with 83 tracked files and no feature 003 change |
| Feature 001 pending item | `specs/001-animal-adoption-management/tasks.md:260` | T104 remains `- [ ]`; feature 001 was not edited |
| Preserved local state | `git stash list` | `pre-003-local-speckit-state-do-not-apply` remains stored and untouched |
| Database safety | commands executed for Issue #15 | Read-only inspection only; no seed, reset, migration, Prisma write, or database test |

## Backend Surface Audit

These records satisfy the backend-only audit in T003. They do not complete the
frontend audit in T004/T005 or the flow mappings in T008-T014.

| Surface | Real evidence | Capability found | Gap or integration risk | Next verifiable step | Owner | Status |
|---------|---------------|------------------|-------------------------|----------------------|-------|--------|
| HTTP routes | `app/api/auth/[...nextauth]/route.ts`, `app/api/mensagens/[id]/route.ts`, `app/api/uploadthing/route.ts` | NextAuth GET/POST, participant-scoped message polling, and authenticated uploads exist | Only three concrete HTTP route groups exist; internal actions/queries are not automatically contracts for the separated frontend | Inventory and define one auth/session proof contract in T015-T019 | Pedro | `audited` |
| Authentication | `lib/auth.ts`, `lib/actions/login.ts`, `lib/actions/auth-guards.ts` | Credentials login, NextAuth JWT session enrichment, active-account rejection, role/profile IDs, and reusable session guards exist | Cookie/proxy behavior and safe frontend SessionDTO are not yet proven; root `/login` is not the public UI | Define and test the auth proof before replacing `frontend/` session mocks | Pedro | `audited` |
| Authorization and ownership | `lib/permissions.ts`, `lib/actions/auth-guards.ts` | Active session, role, adopter/responsible/admin, animal/health/planned-care/document ownership, and conversation participation helpers exist | Every future HTTP handler must invoke the appropriate guard before protected reads or writes; helper presence alone does not prove every flow | Record required guard and 401/403 tests per contract | Pedro | `audited` |
| Mutations | `lib/actions/` (17 files) | Registration, screening, favorites, animal/photo/relationship management, adoption transitions, health, planned care, documents, chat, and admin activation are represented | Server Actions are root-internal boundaries and cannot be consumed directly by the separately published frontend | Map each action group before defining narrow HTTP mutations | Pedro | `audited` |
| Queries | `lib/queries/` (16 files) | Public showcase/detail/metrics plus adopter, owner, animal, health, document, dashboard, chat, and admin reads exist | Some queries accept caller-provided profile IDs while others enforce guards internally; HTTP boundaries must derive protected identity from the session | Classify every query as public or session/role/owner scoped in later contract rows | Pedro | `audited` |
| Validation | `lib/schemas/` (15 files) | Zod schemas cover common input, registration/screening, animals, photos, relationships, favorites, requests, health, planned care, documents, dashboard filters, messages, showcase, and admin state | Existing schemas are evidence, not proof that an HTTP DTO or error shape has been defined | Reuse or narrowly extend schemas when each contract is defined | Pedro | `audited` |
| Uploads | `lib/upload-router.ts`, `app/api/uploadthing/route.ts` | Active responsible-user checks, animal ownership, file constraints, health-record association, and Prisma metadata persistence exist | Upload response DTOs and separated-frontend cookie behavior remain unproven; health files have an explicit 10 MB validation below the route-level allowance | Inventory animal-photo and health-document upload contracts without changing storage | Pedro | `audited` |
| Persistence model | `prisma/schema.prisma` | PostgreSQL schema covers users/profiles, taxonomy, animals/photos/relationships, health/planned care/documents, favorites, adoption requests, and conversations/messages/participants | Organization/foster profile photo is not present; no schema change is authorized by this audit | Treat unproven fields as gaps and test any future migration only in homologation | Pedro | `audited` |
| Tests | `__tests__/actions/` (12), `__tests__/queries/` (9), `__tests__/schemas/` (7) | Existing Vitest coverage includes auth guards, role/ownership, animal XOR/relationships, adoption transactions, CONSULTA exclusion, planned-care idempotency, document privacy, dashboard isolation, chat participation/archive, and schema validation | Existing tests target internal behavior; future HTTP contracts still need 401/403, DTO allowlist, and boundary tests before implementation is accepted | Link existing coverage and add contract-level failing tests in the corresponding Issues | Pedro | `audited` |

## Backend Capability Inventory

| Area | Actions/queries/schemas observed | Persistence source | Contract state |
|------|----------------------------------|--------------------|----------------|
| Session and accounts | `lib/auth.ts`, `lib/actions/login.ts`, `lib/actions/auth-register.ts`, `lib/actions/admin-users.ts`, `lib/queries/admin-users.ts`, auth/admin schemas | `Usuario`, `Adotante`, `Organizacao`, `AcolhedorIndependente`, NextAuth models | Inventory only; no safe frontend DTO defined by Issue #15 |
| Profiles and screening | `lib/actions/auth-register.ts`, `lib/actions/triagem.ts`, `lib/schemas/adotante.ts` | User profile models and adopter screening fields | Inventory only; edit contracts and organization/foster photo decision remain open |
| Public showcase | `lib/queries/animal-showcase.ts`, `lib/queries/public-animal.ts`, `lib/queries/public-metrics.ts`, `lib/schemas/showcase.ts` | `Animal`, taxonomy, photos, allowed health summary | Inventory only; public allowlist contract not yet defined |
| Favorites and adopter journey | `lib/actions/favoritos.ts`, `lib/actions/solicitacoes.ts`, `lib/actions/request-guards.ts`, adopter/favorite queries and schemas | `Favorito`, `SolicitacaoAdocao`, `Adotante`, `Animal` | Inventory only; protected identity must come from session |
| Animal management | animal, photo, relationship and search actions; owned-animal query; related schemas; Uploadthing | `Animal`, `FotoAnimal`, `AnimalRelacionado`, responsible profile | Inventory only; owner-scoped HTTP contracts not yet defined |
| Health and documents | health/planned-care/document actions, queries and schemas; Uploadthing | `RegistroSaude`, `CuidadoPlanejado`, `DocumentoSaude` | Inventory only; feature 002 audit still required before expanded integration |
| Dashboards | adopter and responsible dashboard queries | Real aggregate queries over requests, animals, care, health, and conversations | Inventory only; DTO privacy and ownership contract not yet defined |
| Chat | adoption transitions, message actions/queries/schema, polling route | `ConversaAdocao`, `ConversaParticipante`, `MensagemAdocao` | Polling exists; list/send/read contracts remain to define and must preserve approval/archive rules |
| Administration | admin action/query/schema | `Usuario.ativo` and account/profile data | Inventory only; ADMIN-only DTO contract not yet defined |

## Initial Flow Rows

T008-T014 will add the first frontend-to-backend flow rows using the required
schema above. No row is pre-marked `contract defined`, `backend ready`,
`frontend integrated`, or `flow complete` by Issue #15.

## Preserved Pending and Historical State

- Feature 001 T104 was read at
  `specs/001-animal-adoption-management/tasks.md:260` and remains
  `- [ ] T104 Execute manual acceptance checklist...`. This matrix records it
  only as a known pending item.
- `legacy/frontend-antigo/` remains a tracked historical reference. Issue #15
  made no change under that path, and no active flow may depend on it.
- The stash named `pre-003-local-speckit-state-do-not-apply` remains preserved
  and must not be applied or deleted by this Issue.
