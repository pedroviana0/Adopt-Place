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

## Frontend Surface Audit (T004)

These records satisfy the frontend mock/localStorage audit in T004 (Owner:
Arthur; Issue #17). They record current frontend behavior only; they do not
create HTTP contracts, do not claim any flow is integrated, and do not change any
lifecycle status beyond `audited`.

Headline finding: the entire `frontend/src/lib/data/` layer is served from
in-memory seed plus a single localStorage blob. No file under `frontend/src`
performs a real backend HTTP call (no `fetch` to an API, `axios`,
`XMLHttpRequest`, `VITE_API`, WebSocket, or EventSource); the only `fetch`
occurrences are the TanStack Start SSR handler signature in
`frontend/src/server.ts`. Zero backend integration exists today.

Storage foundation (both keys defined in `frontend/src/lib/data/db.ts`):

- `adoptplace:db:v1` — whole-DB blob. Defined `db.ts:3`; read `db.ts:19`;
  written `db.ts:36` and `db.ts:49`. SSR/empty-storage fallback to `makeSeed()`
  at `db.ts:15,27-29`. All mutating modules write through
  `mutate`/`saveDB` (`db.ts:32-45`).
- `adoptplace:session:v1` — session state. Defined/exported `db.ts:4,64`; read
  `sessao.ts:12`; written `sessao.ts:40`; removed on logout `sessao.ts:41`.
- No `sessionStorage` is used anywhere.

| Module | Domain | Mock/localStorage evidence (paths:lines) | Consumers (routes/components) | Known gap | Status |
|--------|--------|------------------------------------------|-------------------------------|-----------|--------|
| `frontend/src/lib/data/db.ts` | Persistence engine (all domains) | Direct localStorage; keys read `19`, write `36,49`; primitives `loadDB 12-30`, `saveDB 32-37`, `mutate 39-45`, `resetDB 47-51` | Imported by every data module; not imported by routes directly | Single client-side blob; no backend | `audited` |
| `frontend/src/lib/data/seed.ts` | All (DB shape + fixtures) | Hardcoded seed `makeSeed 44-260`; plaintext `senhas` map `56-63` (comment: "mock; nunca fazer isso real") | `db.ts:1` | Plaintext credentials in fixture; must never reach backend | `audited` |
| `frontend/src/lib/data/sessao.ts` | Session / auth | localStorage `SESSION_KEY` read `12` write `40` remove `41`; `login 48-58` checks seed `db.senhas` in memory; no token/HTTP | `routes/_authenticated.tsx:2`, `routes/login.tsx:8`, `components/app/Navbar.tsx:14`, `routes/_authenticated.dashboard.perfil.tsx:16` | No real NextAuth session; contract `Session/login/logout` still `To define` | `audited` |
| `frontend/src/lib/data/hooks.ts` | React reactivity glue | Wraps `db.subscribe` + `sessao.subscribeSessao` via `useSyncExternalStore`; no storage itself | ~19 routes + `RelatedAnimalsPanel.tsx:7`, `HealthPanel.tsx:10` | N/A (glue only) | `audited` |
| `frontend/src/lib/data/animais.ts` | Animals, photos, relationships | `loadDB`/`mutate` (import `3`); writes `createAnimal 64-86`, `updateAnimal 88-97`, `replaceFotos 99-117`, `removerFoto 122-141`, relations `149-169` | `vitrine.tsx`, `index.tsx`, `animais.$animalId.tsx`, dashboard animais routes, `AnimalForm.tsx`, `AnimalCard.tsx`, `RelatedAnimalsPanel.tsx` | Owner-scoped animal contracts `To define` | `audited` |
| `frontend/src/lib/data/usuarios.ts` | Users, adotante/organizacao/acolhedor, triagem | `loadDB`/`mutate` (import `2`); `cadastrar*` write plaintext senha `65,90,115` and auto-login `setSessao` `81,106,130`; `salvarTriagem 134-140`; `setAtivo 22-27` | cadastro routes, perfil routes, `_authenticated.triagem.tsx`, `dashboard.admin.usuarios.tsx`, `animais.$animalId.tsx`, `AnimalCard.tsx` | Registration/profile/admin contracts `To define`; CPF/CNPJ read-only rule unproven client-side | `audited` |
| `frontend/src/lib/data/catalogos.ts` | Catalogs (especies/racas/vacinas/doencas) | `loadDB` read-only `listEspecies 3`, `listRacas 4-5`, `listVacinas 6`, `listDoencas 7` | `AnimalForm.tsx`, `AnimalFilters.tsx`, `HealthPanel.tsx`, `animais.$animalId.tsx` | Public catalog contract `To define` | `audited` |
| `frontend/src/lib/data/favoritos.ts` | Favorites | `loadDB`/`mutate` (import `2`); `toggleFavorito 12-22` | `_authenticated.meus-favoritos.tsx:3`, `animais.$animalId.tsx:13` | ADOTANTE-only favorites contract `To define` | `audited` |
| `frontend/src/lib/data/saude.ts` | Health records + alerts | `loadDB`/`mutate` (import `2`); `createRegistro 10-16`, `deleteRegistro 18-22`, `alertasProximos 24-42` | `dashboard.index.tsx`, `animais.$animalId.tsx`, `HealthPanel.tsx`, `AnimalCard.tsx` | Health contracts `To define`; feature 002 audit (T083) still required | `audited` |
| `frontend/src/lib/data/solicitacoes.ts` | Adoption requests | `loadDB`/`mutate` (import `2`); `createSolicitacao 29-57`, `decidirSolicitacao 61-89`, `concluirAdocao 91-102` (flips animal status client-side) | minhas-solicitacoes, dashboard solicitacoes routes, `dashboard.index.tsx`, `dashboard.adotantes.tsx`, `animais.$animalId.tsx` | Adopter/owner request contracts `To define`; state transitions run in browser | `audited` |

Related seam (not localStorage directly): `frontend/src/lib/upload.ts` compresses
images to base64 data URLs (`compressImageToDataUrl 5-31`) that are stored inside
the `adoptplace:db:v1` blob; `isQuotaExceeded`/`QUOTA_MESSAGE 33-44` handle the
resulting `QuotaExceededError`. It is the documented swap point for a real upload
contract.

## Route Rendering Audit (T005)

These records satisfy the route-rendering audit in T005 (Owner: Arthur; Issue
#17; depends on T004). No lifecycle status is changed beyond `audited`.

Structural checks PASS (no hard defects): every layout renders `<Outlet/>`
(`__root.tsx:116`, `_authenticated.tsx:12`, `cadastro.tsx:13`,
`_authenticated.dashboard.tsx:44`, `_authenticated.dashboard.animais.tsx:4`,
`_authenticated.dashboard.solicitacoes.tsx:4`); every path-bearing layout has an
index child; every `navigate`/`Link`/`redirect` target resolves to a fullPath in
`routeTree.gen.ts`; the auth guard redirects to `/login`, which lives outside the
guarded subtree, so there is no redirect loop; no route lacks a `component`; no
flat-route name collision (`/animais/$animalId` vs
`/dashboard/animais/$animalId`).

Findings recorded are URL-changes-without-expected-screen behaviors caused by the
client-only session model (SSR flash and role gating), for T033 to address:

| ID | Route / trigger | Expected screen | Observed behavior | Evidence (file:line) | Risk | Status |
|----|-----------------|-----------------|-------------------|----------------------|------|--------|
| F1 | Any `/_authenticated/*` via hard refresh / direct URL | Guarded screen (or redirect to `/login`) | Guard skips SSR (`beforeLoad` early-returns server-side) and session reads only localStorage, so first paint has `sessao === null`; correct screen/redirect only after hydration | `_authenticated.tsx:5-11`, `hooks.ts:19-25` (`getServerSnapshot => null`), `sessao.ts:9-19` | medium | `audited` |
| F2 | Protected leaf pages during null-session window | Page content | Component `return null` → blank flash before hydration | `dashboard.index.tsx:15`, `dashboard.animais.index.tsx:17`, `dashboard.solicitacoes.index.tsx:21`, `dashboard.adotantes.tsx:15`, `dashboard.solicitacoes.$solicitacaoId.tsx:27`, `meu-perfil.tsx:15` | low | `audited` |
| F3 | Authenticated wrong-role navigates to a dashboard route | Consistent access decision | Inconsistent: some pages show a denial line, others redirect. Denial text: `_authenticated.dashboard.tsx:15-17` (ADOTANTE), `dashboard.admin.usuarios.tsx:17` (non-admin). Redirect: `dashboard.animais.novo.tsx:19-24`, `dashboard.animais.$animalId.tsx:28-32`, `dashboard.perfil.tsx:60-64` | medium | `audited` |
| F4 | ADMIN opens `/dashboard` (URL-typed) | Admin-appropriate screen | Renders operator "Painel" with all-zero metrics because admin has no `organizacaoId`/`acolhedorId` | `_authenticated.dashboard.tsx:15`, `dashboard.index.tsx:16-20`, `sessao.ts:79-81` | low | `audited` |

Full leaf-vs-layout route inventory and the passing structural checks above are
the recorded evidence base; T033 (Owner: Arthur) consumes F1 as the first
documented URL-change/no-render defect to fix.

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
