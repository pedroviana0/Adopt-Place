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
| HTTP routes | `app/api/auth/[...nextauth]/route.ts`, `app/api/session/route.ts`, `app/api/mensagens/[id]/route.ts`, `app/api/uploadthing/route.ts` | NextAuth GET/POST, protected application session DTO, participant-scoped message polling, and authenticated uploads exist | Internal actions/queries are not automatically contracts for the separated frontend | Issue #21 implemented and validated protected `GET /api/session`; later flows still require their own contracts | Pedro | `backend ready` for AUTH-01 |
| Authentication | `lib/auth.ts`, `lib/auth-credentials.ts`, `lib/actions/login.ts`, `lib/actions/auth-guards.ts`; `frontend/src/lib/data/sessao.ts`, `frontend/src/routes/_authenticated.tsx` | Credentials login, NextAuth JWT session enrichment, current active-account revalidation, safe role/profile session DTO, reusable session guards, and official-frontend consumption exist | Cookie-backed login/reload/logout, no-session 401, inactive-account 403, and protected-route redirect passed in isolated homologation; full frontend lint retains unrelated Prettier debt | Keep later protected flows on the proven session boundary and track repository-wide formatting separately | Pedro | `flow complete` for AUTH-01 |
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
| Session and accounts | `lib/auth.ts`, `lib/auth-credentials.ts`, `app/api/session/route.ts`, `lib/actions/login.ts`, `lib/actions/auth-register.ts`, `lib/actions/admin-users.ts`, `lib/queries/admin-users.ts`, auth/admin schemas | `Usuario`, `Adotante`, `Organizacao`, `AcolhedorIndependente`, NextAuth models | Auth proof backend is ready through Issues #20/#21. Registration/profile/admin contracts remain inventory only |
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

## Frontend to Backend Flow Matrix (T008-T012)

The two tables in this section form one matrix keyed by **Flow ID**. The first
table records product and technical evidence. The second records ownership,
affected areas, Issue relationships, execution order, dependencies, and
acceptance criteria. Together they contain every field required by FR-003.

All rows except AUTH-01 remain `audited`. Existing Server Actions, queries,
schemas, Prisma models, or GitHub Issues do not make an HTTP contract
`contract defined`. AUTH-01 is `flow complete`: Issue #20 records the contract,
Issue #21 implements and validates its backend boundary, Issue #22 consumes it
without the previous session mock/localStorage path, and Issue #23 records the
isolated homologation and validation evidence.

| Flow ID | Flow and current frontend behavior | Current real backend capability | Source of truth | Known gap and risk | Smallest next flow and HTTP contract inventory | Status and evidence |
|---------|------------------------------------|---------------------------------|-----------------|--------------------|------------------------------------------------|---------------------|
| AUTH-01 | Login, session, reload, logout, and protected-route identity use relative NextAuth/API calls in `frontend/src/lib/data/sessao.ts`; session state is cached only in memory and `_authenticated.tsx` awaits the real session contract before allowing protected client navigation. | `lib/auth.ts` preserves NextAuth Credentials and JWT enrichment; `lib/auth-credentials.ts` validates credentials and blocks inactive accounts; `app/api/auth/[...nextauth]/route.ts` exports the protocol handlers; `app/api/session/route.ts` returns the protected allowlisted DTO after revalidating `Usuario.ativo`; auth guards/permissions remain available. | `Usuario`, NextAuth `Account`/`Session` models, `TipoPerfil`, `Usuario.ativo`, and the clarified secure-cookie session rule. | The flow-level acceptance checks passed against an isolated PostgreSQL 16 container. Repository-wide frontend Prettier findings remain an unrelated formatting debt; semantic lint of the auth files passes. SSR cookie forwarding remains outside AUTH-01 and tracked under ROUTES-01. | Keep later profile and protected-flow contracts dependent on this proven session boundary. Inventory group: **Session/login/logout**. | `flow complete`. Evidence: Issues #20-#23; PRs #77/#78; isolated homologation on 2026-07-28; active login/session/reload/logout; 401 without session; invalid-credential denial; 403 `INACTIVE_ACCOUNT`; protected-route redirect; no session localStorage; 31 backend test files/124 tests; backend typecheck, lint, Prisma validation and build; auth semantic lint and frontend production build. T023 and T027-T030 are complete. |
| REG-01 | Registration routes call `cadastrarAdotante`, `cadastrarOrganizacao`, or `cadastrarAcolhedor`, which POST the real contract and then perform explicit NextAuth login. No fictitious session is created. | `POST /api/cadastro/[tipo]` validates strict role DTOs, hashes passwords, checks unique e-mail/CPF/CNPJ, creates `Usuario` and its profile atomically, and returns an allowlisted DTO. | `Usuario`, `Adotante`, `Organizacao`, `AcolhedorIndependente`; unique e-mail, CPF, and CNPJ constraints. | Production still depends on the documented same-origin/proxy deployment. | Keep registration contract stable; no mock removal remains for this slice. | `flow complete`. Evidence: Issues #29-#31; PRs #81/#82; isolated PostgreSQL 16 registration/login round-trip for all three roles; targeted frontend lint and production build. |
| PROFILE-01 | `meu-perfil.tsx` and `dashboard.perfil.tsx` read and edit `/api/perfil` through React Query; profile writes no longer use localStorage. | `GET/PATCH /api/perfil` revalidates the active session account, derives the owned role profile, selects explicit DTO fields, rejects CPF/CNPJ/IDs/unknown fields, and writes e-mail plus profile changes atomically. | `Usuario`, `Adotante`, `Organizacao`, and `AcolhedorIndependente`; FR-009/FR-010 immutable identifier rule. | `fotoUrl` remains a **lacuna/decisao pendente** because it is absent from organization/foster Prisma profiles; no migration was created. | Keep photo behavior blocked pending product decision and homologation. | `flow complete`. Evidence: Issues #29-#31; adopter, organization and foster profile edits survived fresh HTTP reads in isolated PostgreSQL 16; CPF/CNPJ immutable tests; targeted lint/build. |
| SCREEN-01 | `_authenticated.triagem.tsx` loads and saves `/api/triagem`, maps only the two historical Prisma spelling differences at the boundary, and no longer persists screening in localStorage. | `GET/PUT /api/triagem` permits only an active adopter, derives `adotanteId` from the current account, rejects browser IDs and unknown fields, and preserves the existing completed-screening request guard. | Screening fields and `triagemConcluida` on `Adotante`; FR-013. | Sensitive screening data remains excluded from public, profile and session DTOs; a future owner-review contract still needs its own read-only allowlist. | Keep owner review separate from the adopter self-service contract. | `flow complete`. Evidence: Issues #29-#31; isolated save/reload returned `triagemConcluida=true`; logout invalidated session with 401; request guard tests and frontend build passed. |
| SHOWCASE-01 | Public routes use `fetchVitrine`, `fetchPublicAnimal`, `fetchPublicMetrics`, and `fetchCatalogos` through relative HTTP calls; their public read path no longer uses localStorage/mock data. Owner/favorite helpers remain isolated for later flows. | `GET /api/animais`, `/api/animais/[id]`, `/api/metrics`, and `/api/catalogos` return explicit public DTOs backed by the existing queries, schemas, and tags. | `Animal`, `FotoAnimal`, `AnimalRelacionado`, `Especie`, `Raca`, and allowlisted `RegistroSaude`; vaccine/disease catalogs remain outside the proven public contract. | One known Fast Refresh warning remains in `AnimalFilters.tsx`; it does not affect runtime or DTO privacy. Broader owner/favorite mocks are intentionally preserved outside this flow. | Keep public contracts stable while later owner/favorite flows replace their own mock helpers. | `flow complete`. Evidence: Issues #26-#28/PR #79; T035-T043; 8 public API/query tests; frontend semantic lint with 0 errors/1 warning; production build; real loading/error/empty/filter/detail UI and public sensitive-field exclusions. |
| FAVORITES-01 | `favoritos.ts`, animal detail and `meus-favoritos.tsx` consume the real cookie-authenticated contracts; no favorite read/write uses localStorage or a browser-supplied adopter ID. | `GET /api/favoritos` and idempotent `PUT/DELETE /api/favoritos/[animalId]` revalidate the active adopter, derive identity from the session and return allowlisted animal summaries. | Composite `Favorito(adotanteId, animalId)` relation and ADOTANTE-only rule FR-014. | Production still depends on the documented same-origin/proxy deployment. | Keep the contract stable; owner-side animal work is a separate flow. | `flow complete`. Evidence: Issues #32-#34 and PRs #83/#84; backend authorization/idempotency tests and isolated PostgreSQL HTTP round trip; frontend real loading/error/empty states; targeted semantic lint and production build; favorite localStorage removed. |
| REQUEST-ADOPTER-01 | `solicitacoes.ts` uses real HTTP only for adopter create/list; `minhas-solicitacoes.tsx` renders real status data. Mock helpers remain isolated to the future responsible-side flow and are not used by adopter routes. | `GET/POST /api/solicitacoes` and `GET /api/dashboard/adotante` derive the adopter from the active session, enforce screening/availability/duplicate guards and return narrow DTOs. | `SolicitacaoAdocao`, `Animal`, `Adotante`, `StatusSolicitacao`, screening/availability rules and composite uniqueness. | Responsible review/decision remains mock until its own Issues; the Prisma uniqueness constraint still blocks another request for the same adopter/animal after any prior state. | Keep adopter endpoints stable and defer owner decisions to REQUEST-OWNER-01. | `flow complete`. Evidence: Issues #32-#34 and PRs #83/#84; backend guard tests and isolated PostgreSQL 201/409/own-list validation; frontend real create/list, reload-safe persistence, targeted semantic lint and production build. |
| REQUEST-OWNER-01 | Responsible dashboards consume the real protected contracts via React Query in `solicitacoes.ts` (`fetchSolicitacoesGerenciadas`/`fetchSolicitacaoGerenciada`/`decidirSolicitacao` PATCH/`concluirAdocao` POST); `TriagemReadOnly.tsx` renders the read-only owner DTO. The completed responsible-side mock (detail/decision/completion) was removed; `listSolicitacoesPorResponsavel` stays only for out-of-scope dashboard/adopter summaries. | Protected list/detail/decision/completion HTTP contracts revalidate the active responsible account, scope screening reads before selection, exclude CPF/address/user IDs, and enforce approval/refusal/completion transitions transactionally. | `SolicitacaoAdocao`, `Animal`, conversation entities, and the APROVADA/RECUSADA/CONCLUIDA transition rules. | Live HTTP round-trip against a homologation database remains pending (executed later under SC-006/T122). | Homologation round-trip approving/refusing/completing a real request. | `frontend integrated`. Evidence: backend Issue #43 (18 focused request tests; 401/inactive-account/ownership/privacy/repeated-transition and transactional coverage). Frontend Issue #45 / PR #88 (merged into `main`, tasks T080/T081): React Query integration, per-flow mock removal, and clean `tsc --noEmit` / targeted `eslint` / `npm run build`. Promotion to `flow complete` awaits the manual homologation round-trip. |
| ANIMALS-CRUD-01 | Dashboard list/create/detail/update/delete uses protected HTTP. Create now persists the animal, uploads its selected primary photo and waits for a fresh protected read before reporting success; a failed upload keeps the existing animal ID for retry instead of creating a duplicate. Completed owner CRUD functions no longer use localStorage. | Protected animal handlers revalidate the active responsible account, derive exactly one owner server-side, prevent owner transfer and return allowlisted DTOs. | `Animal`, responsible profiles, taxonomy and exactly-one responsible rule. | No flow-specific mock remains in the completed management functions. | Keep the protected contract stable. | `flow complete`. Evidence: Issues #35/#36/#39/#40/#41/#42; focused unit tests/typechecks; isolated manual homologation on 2026-07-31 confirmed animal registration, provider upload and fresh real state. |
| ANIMALS-PHOTOS-01 | `AnimalPhotosPanel.tsx` uploads new images through the canonical `/api/uploadthing` route and retains protected HTTP operations for reorder, primary selection and deletion. `AnimalForm.tsx` requires and confirms the first primary photo before create-flow success. | Upload middleware and completion revalidate active account, responsible role and current ownership; type/size limits are checked on both sides; a serializable transaction assigns first-primary/order; the only photo cannot be deleted. | `FotoAnimal`, max 10 photos, required primary photo and ordered gallery rule. | No open upload-provider gap remains in the homologated local isolated environment. | Keep the authorized upload contract stable; health-document upload remains a separate future flow. | `flow complete`. Evidence: Issues #35/#36/#39/#40/#41/#42; focused authorization/persistence tests; isolated manual homologation on 2026-07-31 confirmed first and additional UploadThing photos, provider registration, and photo reordering. CORS credential scope and per-file UploadThing custom IDs were corrected during this homologation. |
| ANIMALS-RELATIONSHIPS-01 | `RelatedAnimalsPanel.tsx` lists candidates and links/unlinks through the real protected relationship contracts; completed relationship functions no longer use localStorage. | Protected list/link/unlink handlers require ownership of both animals; link and unlink update both directions transactionally, reject self-links and avoid duplicate pairs. | Paired `AnimalRelacionado` rows and ownership of both animals. | No flow-specific mock remains. | Keep the owner-safe relationship DTO stable. | `flow complete`. Evidence: Issues #35/#38/#39/#41, PR #86, relationship transaction tests, frontend semantic lint and production build. |
| ANIMALS-SEARCH-01 | Dashboard filters and related-animal candidates call `GET /api/animais/gerenciados` with protected owner-scoped query parameters. | The contract combines `q`, status, taxonomy, porte and sexo while always retaining organization/foster ownership. | Indexed animal fields plus responsible ownership predicates. | No flow-specific mock remains. | Keep the protected filter contract stable. | `flow complete`. Evidence: Issues #35/#39/#40/#41, PR #86, owner/filter tests, frontend semantic lint and production build. |
| HEALTH-BASIC-01 | `saude.ts` and `HealthPanel.tsx` consume the real protected contracts via React Query (`fetchRegistrosSaude`/`criarRegistroSaude`/`excluirRegistroSaude`); the create form aligns to the contract (name sent as `nomeCustom` since the backend ignores `vacinaId`/`doencaId`; no `responsavelRegistro` input as the backend stores "Sistema"; required `frequencia`; ISO datetime dates). Completed health mock (`createRegistro`/`deleteRegistro`) removed; `listRegistros`/`alertasProximos` stay for the orphan card and dashboard summary. | Protected health list/create/update/delete and 30-day alert contracts support the five Prisma history categories, reject `CONSULTA`, validate dates, revalidate ownership/account state and synchronize pending derived care transactionally. | `RegistroSaude`, `CuidadoPlanejado`, `TipoRegistroSaude`, owned `Animal`, and FR-017/FR-018/FR-051. | The frontend health UI still exposes only 3 of the 5 backend categories (VACINA/CONTROLE_PARASITAS/TESTE_DOENCA); MEDICAMENTO_TRATAMENTO/PROCEDIMENTO stay a recorded gap. Live HTTP round-trip against a homologation database remains pending. Feature 002 expanded health remains outside this slice and still requires T083. | Homologation round-trip creating/deleting a real health record; later align the 5 categories. | `frontend integrated`. Evidence: backend Issue #44 (15 focused health tests; 401/wrong-role/inactive/ownership/date/CONSULTA/transaction/alert coverage). Frontend Issue #46 / PR #88 (merged into `main`, tasks T080/T081): React Query integration, per-flow mock removal, and clean `tsc --noEmit` / targeted `eslint` / `npm run build`. Promotion to `flow complete` awaits the manual homologation round-trip. |
| F002-HEALTH-01 | No complete dedicated Central de Saude data module or route is proven in the active frontend; existing health UI is based on `saude.ts` mock records/alerts. | `lib/actions/cuidados-planejados.ts`, `lib/queries/health-dashboard.ts`, and planned-care schemas support agenda, overview, timeline, reschedule/cancel/complete, including CONSULTA. | `CuidadoPlanejado`, `RegistroSaude`, their enums/relations, and the rule that CONSULTA never becomes clinical history. | **Critical**: feature 002 audit T083 is mandatory before contract definition; dedicated frontend surface and DTO alignment are gaps. | Audit feature 002, then define one health-center contract that preserves CONSULTA exclusion and idempotency. Inventory group: **Health records and agenda**. | `audited`. Evidence: backend files/tests exist; frontend gap recorded by plan and T004. No completion claim. |
| F002-DASHBOARD-01 | `_authenticated.dashboard.index.tsx` still needs to consume the real contract; ADMIN behavior remains separate frontend route work. | `GET /api/dashboard/operacional` wraps `getOperationalDashboard` after current-account and responsible-profile revalidation. | Real owner-scoped aggregates over animals, requests, care and health; FR-020. | Frontend consumption and per-flow mock removal remain #54/#56. | Integrate only after the frontend audit identifies exact files. | `backend ready`. Evidence: Issues #50/#53, `OPERATIONAL-DASHBOARD-01`, API/query ownership tests. |
| F002-DOCUMENTS-01 | No dedicated health-document route/data module is proven in `frontend/`. | Owner-scoped list/detail/delete routes plus the existing UploadThing route revalidate current ownership and return an allowlisted private DTO. | `DocumentoSaude`, owned `Animal`, optional `RegistroSaude`, private-document rule and unique provider upload IDs. | Frontend UI and per-flow mock removal remain #54/#57. | Integrate only after frontend type/surface audit. | `backend ready`. Evidence: Issues #51/#53, `HEALTH-DOCUMENTS-01`, API/action/query/upload privacy tests. |
| F002-CHAT-01 | No dedicated chat route/data module is proven in `frontend/`. | Conversation list/detail/send/read routes and safe polling expose existing participant-scoped actions/queries; polling excludes sender IDs. | Approval creates chat; completion archives it; only participants read; archived sends are blocked; ADMIN has no implicit access. | Frontend UI and lifecycle integration remain #54/#58. | Integrate after frontend audit, preserving post-completion read-only behavior. | `backend ready`. Evidence: Issues #52/#53, `ADOPTION-CHAT-01`, API/action/query/polling/lifecycle tests. |
| ADMIN-01 | `usuarios.ts` lists all mock users and toggles `ativo` locally; `dashboard.admin.usuarios.tsx` consumes it. | `lib/actions/admin-users.ts`, `lib/queries/admin-users.ts`, `lib/schemas/admin-user.ts`, and `requireAdmin` support real list/activation behavior. | `Usuario.ativo`, `TipoPerfil.ADMIN`, and no-password-hash rule. | **High**: ADMIN-only HTTP contracts and safe AdminUserDTO are undefined; frontend mock shape may include fields outside the allowlist. | Prove admin-only list/toggle and inactive-user block without exposing `senhaHash`. Inventory group: **Admin users**. | `audited`. Evidence: admin route/module, backend action/query/schema, and `admin-users.test.ts`. |
| ROUTES-01 | Route structure resolves, but F1-F4 document SSR session flash, blank protected leaves, inconsistent wrong-role handling, and an ADMIN zero-dashboard state. | Backend auth/role rules exist, but root visual routes are not a fallback UI and no backend route change is required by this audit. | TanStack route tree plus FR-027/FR-028 and the single-public-interface rule. | **Medium**: route acceptance depends on the real session contract and consistent frontend role handling. | Correct F1 after AUTH-01 backend readiness, then record remaining defects. No standalone HTTP inventory group; dependency is **Session/login/logout**. | `audited`. Evidence: T005 structural checks and findings F1-F4. |

## Issue Pair and Execution Matrix (T013)

Issue numbers below refer to approved Issues that already exist in GitHub.
Issue #18 mapped the pairs. T014/Issue #19 was completed by PR #75 and records
the frontend-owned gaps below. Issue #20 closes the initial HTTP inventory and
does not implement any later Issue.

| Flow ID | Responsible side and owners | Related Issues | Affected files or areas | Execution order and dependencies | Acceptance criteria |
|---------|-----------------------------|----------------|-------------------------|----------------------------------|---------------------|
| AUTH-01 | Backend/contracts/tests: Pedro. Frontend/session/routes: Arthur. Final certification: Pedro. | Backend #21; frontend #22; certification #23. | `lib/auth.ts`, `lib/permissions.ts`, auth route, auth tests; `frontend/src/lib/data/sessao.ts`, `_authenticated.tsx`, login/Navbar. | #20 closes initial contract inventory; #21 before #22; #23 after both. | Active login works; session survives reload; logout clears access; no-session returns 401; inactive user is blocked; session DTO excludes sensitive fields; session localStorage is removed only after success. |
| REG-01, PROFILE-01, SCREEN-01 | Backend/profile contracts/tests: Pedro. Frontend forms/data: Arthur. Certification: Pedro. | Backend #29; frontend #30; certification #31. | Registration/profile/screening actions, schemas, auth and future documented handlers; `usuarios.ts`, cadastro/profile/triagem routes. | #23 authentication proof before protected profile/screening; #29 before #30; #31 after frontend evidence. Profile photo remains blocked on product decision/homologation. | Real registration and allowed profile/screening edits persist; CPF/CNPJ remain immutable; active/role/ownership checks pass; sensitive screening data stays protected; mocks removed only for proven slices. |
| SHOWCASE-01 | Public backend DTO/contracts/tests: Pedro. Frontend vitrine/detail consumption: Arthur. Certification: Pedro. | Backend #26; frontend #27; certification #28. | Public queries/showcase schema/tags and documented handlers; `animais.ts`, `catalogos.ts`, public routes/cards/filters/detail panels. | #20 before #26; #26 before #27; #28 after mock removal evidence. | Real filters, metrics, empty states, photos, tags, detail, and relationships render; public DTO excludes personal, internal health, request, document, and chat data. |
| FAVORITES-01, REQUEST-ADOPTER-01 | Backend adopter contracts/guards/tests: Pedro. Frontend favorites/request/dashboard consumption: Arthur. Certification: Pedro. | Backend #32; frontend #33; certification #34. | Favorite/request actions, guards, queries, schemas and handlers; `favoritos.ts`, `solicitacoes.ts`, adopter routes/dashboard. | #23 and #31 before protected request journey; #32 before #33; #34 after persistence and per-flow mock removal. | Only a real adopter can favorite/request; screening, duplicate, and availability rules hold; persisted data survives reload/logout/storage clearing. |
| REQUEST-OWNER-01 | Backend owner decision contracts/tests: Pedro. Frontend request review: Arthur. Certification: Pedro. | Backend #43; frontend #45; certification #47. | Request actions/owner queries/decision schema and handlers; responsible request routes, `solicitacoes.ts`, `TriagemReadOnly.tsx`. | #23 and animal backend readiness before owner operations; #43 before #45; #47 after both request and health slices. | Only the animal owner sees private request/triage data and decides; approval/refusal/completion transitions and competing-request behavior remain transactional. |
| ANIMALS-01 | Backend split across contracts/schemas/CRUD/photos/relations/search: Pedro. Frontend CRUD/photos and relations/search: Arthur. Certification: Pedro. | Backend #35, #36, #37, #38, #39; frontend #40, #41; certification #42. | Animal/photo/relation/search actions, owner query, schemas, upload router/route and tests; `animais.ts`, upload helper, dashboard animal routes/components. | #23 before owner contracts; #35 establishes contracts/schemas; #36-#39 before #40/#41 for each slice; #42 after all required evidence. | Organization/foster manages only owned animals; XOR owner, photo order/primary, upload checks, self-link rejection, bidirectional relations, and filters pass; only completed mock functions are removed. |
| HEALTH-BASIC-01 | Backend health/request slices: Pedro. Frontend health UI: Arthur. Certification: Pedro. | Backend #44; frontend #46; certification #47. | Health action/alerts/schema/tests and documented handlers; `saude.ts`, `HealthPanel.tsx`, owner animal/dashboard routes. | #23 and #42 before owned health management; #44 before #46; #47 after #43/#45 and #44/#46. | Only owner manages health; dates and five real categories validate; private fields are not public; CONSULTA is never a completed history record. |
| F002-HEALTH-01 | Feature 002 audit/backend: Pedro. Frontend gap/type alignment and health center: Arthur. Certification: Pedro. | Audit #48; backend #49; backend certification #53; frontend audit/types #54; frontend #55; final certification #59. | Planned-care/health-dashboard actions, queries, schemas, tests; exact frontend areas identified by #54. | #48 before any contract; #49 before #53; #54 after audited contracts; #55 after #53/#54; #59 last. | CONSULTA stays outside history; planned-care completion is idempotent; owner scope, frontend DTO alignment, real data, and per-flow mock removal are evidenced. |
| F002-DASHBOARD-01 | Feature 002 audit/backend: Pedro. Frontend dashboard/types: Arthur. Certification: Pedro. | Audit #48; backend #50; backend certification #53; frontend audit/types #54; frontend #56; final certification #59. | Operational dashboard query/tests and documented handler; dashboard frontend areas identified by #54. | #48 before #50; #50 before #53; #54 before #56; #59 after backend/frontend evidence. | Metrics come from current owner-scoped source data, role behavior is explicit, and no other responsible party's data is aggregated. |
| F002-DOCUMENTS-01 | Feature 002 audit/backend privacy/upload: Pedro. Frontend document UI/types: Arthur. Certification: Pedro. | Audit #48; backend #51; backend certification #53; frontend audit/types #54; frontend #57; final certification #59. | Document actions/queries/schemas/upload/tests and exact frontend areas identified by #54. | #48 before #51; #51 before #53; #54 before #57; #59 after privacy and mock-removal evidence. | Only the owner can list/view/upload/delete document metadata; file validation passes; private URLs/metadata are not exposed publicly. |
| F002-CHAT-01 | Feature 002 audit/backend chat security: Pedro. Frontend chat/types: Arthur. Certification: Pedro. | Audit #48; backend #52; backend certification #53; frontend audit/types #54; frontend #58; final certification #59. | Message actions/queries/schema/polling route/tests and exact frontend areas identified by #54. | #48 before #52; #52 before #53; #54 before #58; #59 after lifecycle evidence. | Only approved-request participants access chat; no access in analysis/refused states; history remains visible and sending is blocked after conclusion; ADMIN receives no implicit access. |
| ADMIN-01 | Backend admin contract/security/tests: Pedro. Frontend admin consumption: Arthur. Certification: Pedro. | Backend #60; frontend #61; certification #62. | Admin action/query/schema/guards/tests and handler; `usuarios.ts`, admin route/navigation. | #23 before protected admin flow; #60 before #61; #62 after per-flow mock removal. | ADMIN alone lists/toggles real accounts; inactive users are blocked; password hash and private profile data are excluded. |
| ROUTES-01 | Frontend route correction: Arthur. Root service/auth dependency validation and matrix evidence: Pedro. | Frontend #24; validation #25. | `frontend/src/routes/`, route tree/navigation; root `app/` service-only audit and matrix. | AUTH-01 contract/backend readiness before accepting F1; #24 correction before #25 certification. | Supported navigation renders the expected official frontend screen or remains an explicit defect; root UI is not used as fallback. |

## Frontend-only Gaps (T014)

These records satisfy T014 (Owner: Arthur; Issue #19, merged by PR #75). They review the
Arthur/Claude-owned side of the flow rows above and record the gaps whose
resolution is a frontend responsibility once the matching backend contract
reaches `backend ready`. This is a documentation review only: **no `frontend/`
code is changed, no lifecycle status is promoted, and `tasks.md` is not
edited**. Every flow remains `audited`. Enum/type divergences are recorded as
gaps, not resolved by assumption; a frontend enum, type, or mock is not aligned
until its contract is defined and the row is `backend ready`.

| Flow ID | Frontend-only gap (real evidence) | Affected frontend areas | Cannot start until |
|---------|-----------------------------------|-------------------------|--------------------|
| AUTH-01 | Session is client-only: `getSessao` reads `adoptplace:session:v1` (`sessao.ts:12`) and `useSessao` returns `null` on the server (`hooks.ts:24`); the guard skips SSR (`_authenticated.tsx:6`). Frontend must consume a real SessionDTO and remove localStorage session **only after** login/reload/logout pass. | `frontend/src/lib/data/sessao.ts`, `hooks.ts`, `routes/_authenticated.tsx`, `login.tsx`, `components/app/Navbar.tsx` | AUTH-01 `backend ready` (#22) |
| REG-01, PROFILE-01, SCREEN-01 | `cadastrar*` auto-login (`usuarios.ts:81,106,130`) is an untrusted client rule to drop; CPF/CNPJ read-only must be enforced in the forms; screening answers are sensitive. `fotoUrl` exists in frontend org/foster types (`types.ts:75,88`) but not in Prisma → **lacuna/decisão pendente**, no frontend change until a product decision + homologation. | `usuarios.ts`, `routes/cadastro.*.tsx`, `_authenticated.triagem.tsx`, `_authenticated.meu-perfil.tsx`, `_authenticated.dashboard.perfil.tsx`, `lib/domain/types.ts` | profile/screening `backend ready` (#30); photo row stays blocked |
| SHOWCASE-01 | Routes render seeded arrays directly from `animais.ts`/`catalogos.ts`; must consume the public DTO and render real empty/filter/loading states; vaccine/disease catalog read is unproven. | `animais.ts`, `catalogos.ts`, `routes/index.tsx`, `vitrine.tsx`, `animais.$animalId.tsx`, `components/app/AnimalCard.tsx`, `AnimalFilters.tsx` | public showcase `backend ready` (#27) |
| FAVORITES-01, REQUEST-ADOPTER-01 | `adotanteId` is accepted from the browser (`favoritos.ts:4,8,12`) and adoption transitions run client-side in `solicitacoes.ts` (`createSolicitacao`, `decidirSolicitacao`, `concluirAdocao`). Identity must come from the session and transitions must move to the backend. | `favoritos.ts`, `solicitacoes.ts`, `routes/_authenticated.meus-favoritos.tsx`, `_authenticated.minhas-solicitacoes.tsx`, `animais.$animalId.tsx` | adopter journey `backend ready` (#33) |
| REQUEST-OWNER-01 | Owner dashboards mutate competing requests and animal status client-side (`solicitacoes.ts`); must consume an owner-scoped read-only DTO plus a backend decision endpoint; private triage data needs a narrow DTO. | `solicitacoes.ts`, `routes/_authenticated.dashboard.solicitacoes.*.tsx`, `components/app/TriagemReadOnly.tsx` | owner review `backend ready` (#45) |
| ANIMALS-01 | Frontend types accept broad partial updates; `upload.ts` stores compressed base64 images inside the `adoptplace:db:v1` blob. Must consume owner CRUD/photo/relationship/search contracts and real upload responses. | `animais.ts`, `lib/upload.ts`, `routes/_authenticated.dashboard.animais.*.tsx`, `components/app/AnimalForm.tsx`, `RelatedAnimalsPanel.tsx` | animal management `backend ready` (#40/#41) |
| HEALTH-BASIC-01 | Frontend `TipoRegistroSaude` has **3** values (`enums.ts`: VACINA, CONTROLE_PARASITAS, TESTE_DOENCA) vs backend **5** (`prisma/schema.prisma:51-57`: + MEDICAMENTO_TRATAMENTO, PROCEDIMENTO). Frontend must align to the 5 real categories — recorded as a gap, not changed now. (`StatusAnimal` and `StatusSolicitacao` are already aligned 5/5 and 4/4.) | `lib/domain/enums.ts`, `saude.ts`, `components/app/HealthPanel.tsx` | health `backend ready` (#46) |
| F002-HEALTH-01, F002-DASHBOARD-01, F002-DOCUMENTS-01, F002-CHAT-01 | **Frontend surface missing**: no chat or health-document data module in `frontend/src/lib/data/` and no chat/document component in `components/app/` (confirmed by inventory); health center has no dedicated module (reuses `saude.ts`); operational dashboard renders a zeroed panel for ADMIN (F4). New frontend surfaces are required, not just mock swaps. | new modules/routes/components to be identified by #54; existing `_authenticated.dashboard.index.tsx`, `HealthPanel.tsx` | feature 002 audit #48 + frontend audit/types #54 |
| ADMIN-01 | Frontend admin mock lists all users and toggles `ativo` locally; the consumed shape must be narrowed to a safe AdminUserDTO that excludes `senhaHash` and private profile data. | `usuarios.ts`, `routes/_authenticated.dashboard.admin.usuarios.tsx` | admin `backend ready` (#61) |
| ROUTES-01 | F1–F4 are frontend-only defects: F1 SSR client-only guard, F2 six `return null` blank leaves, F3 inconsistent wrong-role handling (denial text vs redirect), F4 ADMIN zero-dashboard. F1 is corrected first once AUTH-01 is backend-ready. | `routes/_authenticated.tsx`, protected leaf routes, `_authenticated.dashboard.tsx`, `_authenticated.dashboard.admin.usuarios.tsx` | AUTH-01 readiness; correction #24 |

**Cross-cutting frontend-only gap:** the entire data layer is mock/localStorage
(`db.ts` + `seed.ts`, single `adoptplace:db:v1` blob). Per-flow mock/localStorage
removal is allowed only after that flow is validated; the final removal/isolation
of `db.ts` and `seed.ts` is deferred to T114–T115 and must not happen in any
earlier flow. No frontend code is modified by this T014 review.

## Frontend Acceptance Notes — AUTH-01 (T023, Issue #22)

These are the frontend acceptance notes for the authentication proof (T023) plus
the frontend integration evidence produced by T027–T029 (Issue #22). They record
what the frontend now does and how it was validated. Pedro/Codex reviewed the
merged evidence and completed the isolated homologation in Issue #23, promoting
the session row to `flow complete` and completing T030.

**Frontend integration done (Arthur, Issue #22):**

- `frontend/src/lib/data/sessao.ts` now consumes the real contract
  `AUTH-SESSION-01` (`GET /api/session`, `credentials: "include"`), logs in via
  `POST /api/auth/callback/credentials` with a `GET /api/auth/csrf` token, and
  logs out via `POST /api/auth/signout`. Session is cached in memory only.
- **localStorage session persistence removed** for the auth flow (T028): no
  `SESSION_KEY` read/write remains in `sessao.ts`; the NextAuth HTTP-only cookie
  is the only session source. `db.ts`/`seed.ts` are untouched (T114–T115 scope).
- `frontend/src/routes/_authenticated.tsx` guard (T029) now awaits the real
  session (`ensureSessaoLoaded`) before allowing the protected tree.
- Consequential wiring (documented): `login.tsx` and `Navbar.tsx` await the now
  async `login`/`logout`; `frontend/vite.config.ts` adds a dev-only `/api` proxy
  to the local backend (sanctioned by the T019 decision).

**Acceptance checks (isolated homologation — 2026-07-28):**

Environment: local Docker PostgreSQL 16 container
`adoptplace-issue23-pg`, disposable database `adoptplace_issue23` bound only to
`127.0.0.1:55432`, backend at `localhost:3000`, and official frontend/proxy at
`localhost:5173`. The two committed migrations and the existing seed were
applied only to this disposable database. The original database was never used.

| # | Step | Recorded result |
|---|------|-----------------|
| 1 | Login with a valid active account | Passed as `ADOTANTE`: credentials callback succeeded and `GET /api/session` returned 200 with the allowlisted DTO. |
| 2 | Refresh/reload while logged in | Passed: a second session request with the same secure-cookie session returned 200; `sessao.ts` has no session localStorage access. |
| 3 | Logout | Passed: signout completed and the next `GET /api/session` returned 401. Steps 1–3 plus the initial no-session check completed in 2.84 seconds. |
| 4 | Open a protected route without a session | Passed by exercising the real route guard against the live API: redirect to `/login` with `next=/dashboard`. Browser automation was unavailable, so no visual screenshot is claimed. |
| 5 | Invalid credentials | Passed in 0.71 second: callback returned `CredentialsSignin` and no session was created (`GET /api/session` returned 401). |
| 6 | Inactive account | Passed as `ORGANIZACAO` in 1.40 second: an existing 200 session changed to 403 `INACTIVE_ACCOUNT` after deactivation in the disposable database; the test account was restored immediately. |

**Known limitations recorded (not resolved by assumption):**

- SessionDTO excludes `nome`/`fotoUrl`; the frontend shows the e-mail as display
  name until the profile contract (Issue #30). No name/photo endpoint is invented.
- Login-time inactive blocking relies on NextAuth error masking, so step 5/6 may
  both surface the generic message at login; the authoritative inactive block and
  exact message are proven by the `GET /api/session` 403 (Issue #21 tests).
- True SSR session cookie forwarding remains out of scope. Issue #24/T033 added
  the explicit loading state and real client-side guard used by this
  certification; remaining wrong-role/ADMIN route behavior stays under
  ROUTES-01.

**Issue #23 certification review:**

- Runtime: all six AUTH-01 checks above passed through the official frontend
  proxy and real backend against the isolated disposable database.
- Backend: `npm test` (31 files, 124 tests), `npm run typecheck`,
  `npm run lint`, `npm run prisma:validate`, and `npm run build` passed.
- Frontend: auth-file semantic ESLint passed with only the repository's Prettier
  rule disabled; `npm --prefix frontend run build` passed.
- Known validation debt: the normal frontend lint still reports existing
  Prettier formatting findings in Arthur-owned files. This certification does
  not reformat unrelated frontend files; no semantic auth lint error remains.
- Security/static checks: `sessao.ts` has no `SESSION_KEY`, session
  `localStorage`, plaintext seed-password login, Prisma import, PostgreSQL
  import, or database credential. It uses only relative authenticated HTTP
  contracts, and the returned session DTO exposes no password or raw Prisma
  model.
- Database safety: migrations and seed ran only against
  `adoptplace_issue23` in `adoptplace-issue23-pg`; no reset was used and the
  original database was not contacted.

Result: T023 and T027-T030 have merged or recorded verifiable evidence.
AUTH-01 is `flow complete`.

## Route Tree Audit (T031) and Route Correction (T033) — Issue #24

Owner: Arthur. This records the route-tree/filename audit (T031) and the fix of
the first documented URL-change/no-render defect F1 (T033). No lifecycle status
is promoted; ROUTES-01 certification and matrix promotion remain Pedro's T034.

**Route tree audit (T031):**

- 27 route files under `frontend/src/routes/`; `frontend/src/routeTree.gen.ts`
  registers every one with a matching `fullPath` (e.g. `/`, `/vitrine`,
  `/login`, `/animais/$animalId`, the pathless `/_authenticated` layout, and the
  nested `/_authenticated/dashboard/...` tree with its index children).
- Filenames follow the documented TanStack flat convention in
  `frontend/src/routes/README.md`: dot-separated nesting, bare `$` dynamic
  segments (`$animalId`, `$solicitacaoId`), and `_authenticated`/`__root`
  layout prefixes. No anomaly found: no `src/pages/`, no curly-brace or `*`
  splat filenames, no hand edits to the generated tree, no flat-route name
  collision (`/animais/$animalId` vs `/dashboard/animais/$animalId`).
- The generated tree is consistent with the files; generation is healthy.

**Route correction (T033 — F1):**

- **Defect (from T005 F1):** on SSR / hard refresh / direct protected URL, the
  guard skipped SSR and session read only localStorage, so the first paint had
  `sessao === null` and showed a blank/flash before hydration.
- **Fix in `frontend/src/routes/_authenticated.tsx`:** the guard now awaits the
  real session (`ensureSessaoLoaded` → `GET /api/session`, from Issue #22) and
  the `_authenticated` layout renders an explicit loading state
  (`AuthPending`) while no session is resolved, instead of a blank. Result:
  SSR/first paint shows "Carregando…", then either the protected screen (session
  present) or a `/login?next=<path>` redirect (no session). This also closes the
  F2 blank window, since protected leaves no longer render before a session
  exists.
- **Residual (recorded, not fixed here):** true server-side rendered session
  (SSR cookie forwarding) is out of scope; F3 (inconsistent wrong-role handling)
  and F4 (ADMIN zeroed `/dashboard`) remain separate defects for a later
  route-correction round. Only the first documented defect F1 is addressed by
  T033.
- **Executed validation:** ESLint on `_authenticated.tsx` (clean, 0 errors) and
  `npm --prefix frontend run build` (OK). Live SSR/refresh behavior is a manual
  homologation check recorded above under AUTH-01.

## Root Service-Only Audit (T032) and Route Correction Evidence (T034) — Issue #25

Owner: Pedro (executed by Arthur/Claude under explicit maintainer authorization
for this cycle; identity `thurreis7`). Records the root service-only audit (T032)
and the route-correction evidence (T034, depends on T033). `tasks.md` is not
edited here.

**Root service-only audit (T032):**

- `app/` contains **only** backend API route handlers:
  `app/api/auth/[...nextauth]/route.ts`, `app/api/session/route.ts`,
  `app/api/mensagens/[id]/route.ts`, `app/api/uploadthing/route.ts` (plus
  `.gitkeep` markers).
- **No** `page.tsx`, `layout.tsx`, or any non-`api/` file exists under `app/`.
  The root is confirmed service-only per FR-004/FR-031; it is not a competing
  public UI and not a fallback. `frontend/` remains the only official public
  interface.

**Route correction evidence (T034):**

- **F1 fixed** (T033, Issue #24 / PR #79): the `_authenticated` guard consumes
  the real session and the layout shows a loading state instead of a blank first
  paint on SSR/refresh/direct URL. **F2** (blank protected leaves) is closed as a
  side effect, since leaves no longer render before a session exists.
- **Remaining route defects (tracked, not yet fixed):** **F3** inconsistent
  wrong-role handling (denial text vs redirect) and **F4** ADMIN `/dashboard`
  zeroed operator panel. Both remain `audited` for a later route-correction round.
- **Dependency for full ROUTES-01 advancement:** AUTH-01 must reach
  `flow complete` (T030) before ROUTES-01 is certified; this row records evidence
  only and does not itself promote ROUTES-01 beyond the proven state.

## Public Showcase Backend (T037-T039) — Issue #26

Owner: Pedro (executed by Arthur/Claude under explicit maintainer authorization
for this cycle; identity `thurreis7`). Advances SHOWCASE-01 from `audited`
through `contract defined` (T037) to `backend ready` (T039). `tasks.md` is not
edited here.

- **Contracts defined (T037):** `GET /api/animais`, `GET /api/animais/[id]`,
  `GET /api/metrics`, `GET /api/catalogos` are documented in
  `contracts/http-contract-inventory.md` (methods/paths, public auth, request
  filters, response allowlists, sensitive/clinical exclusions).
- **Backend implemented (T038):** route handlers in `app/api/animais/route.ts`,
  `app/api/animais/[id]/route.ts`, `app/api/metrics/route.ts`, and
  `app/api/catalogos/route.ts` reuse `lib/queries/animal-showcase.ts`,
  `public-animal.ts`, `public-metrics.ts`, and `lib/tags.ts`. `public-animal.ts`
  was tightened so the public health summary exposes only `tipo` + `dataRegistro`
  (Issue #26 privacy decision); granular clinical fields are no longer selected.
- **Validated:** `__tests__/api/public-animais.test.ts` (DTO shape, tags, 404,
  sensitive/clinical-field exclusion) and the tightened
  `__tests__/queries/public-animal.test.ts`; full `npm test`, `npm run typecheck`,
  and `npm run lint` recorded in the PR. No seed/reset/migration; Prisma
  `generate` only.
- **Status:** SHOWCASE-01 → **`backend ready`**. Frontend consumption and
  per-flow mock removal remain Issue #27 (T040-T042, Arthur); `flow complete`
  stays pending Pedro's T043 after frontend evidence.

## Public Showcase Certification (T040-T043) — Issues #27/#28

- `frontend/src/lib/data/animais.ts` and `catalogos.ts` consume the four public
  contracts over relative `/api/*` calls. Public routes use React Query and
  render loading, error, empty, filter, pagination, metrics, detail, health
  summary, photos, tags, and related-animal states from real DTOs.
- The public route path no longer calls `loadDB` or localStorage. Mock helpers
  remain only for owner/favorite flows that are not part of SHOWCASE-01.
- Validation on 2026-07-28: `__tests__/api/public-animais.test.ts` and
  `__tests__/queries/public-animal.test.ts` passed (8 tests); targeted frontend
  semantic ESLint passed with 0 errors and one existing Fast Refresh warning;
  `npm --prefix frontend run build` passed.
- Public response tests exclude personal contacts and identifiers, raw ownership
  IDs, detailed clinical fields, requests, documents, and chat data.

Result: SHOWCASE-01 is `flow complete`; T035-T043 are complete.

## Profile and Screening Field Audit (T046) — Issue #29

- Prisma proves editable profile fields for adopter, organization, and foster,
  unique `Usuario.email`, immutable unique CPF/CNPJ identifiers, and adopter
  screening fields plus `triagemConcluida`.
- `frontend/INTEGRATION.md` and `frontend/src/lib/domain/types.ts` expect
  organization/foster `fotoUrl`, but neither profile contains that field in
  `prisma/schema.prisma`. It remains `lacuna/decisão pendente`; it is excluded
  from PROFILE-01 and no migration is created.
- Exact registration, own-profile, and own-screening contracts are documented in
  `contracts/http-contract-inventory.md`. Identity comes from the active
  NextAuth session; CPF/CNPJ and browser-supplied profile IDs are rejected.
- REG-01, PROFILE-01, and SCREEN-01 are `backend ready` after the documented
  handlers passed 136 backend tests, typecheck, lint, Prisma schema validation,
  and production build. Frontend consumption and per-flow mock removal remain
  Issue #30.

## Preserved Pending and Historical State

- Feature 001 T104 was read at
  `specs/001-animal-adoption-management/tasks.md:260` and remains
  `- [ ] T104 Execute manual acceptance checklist...`. This matrix records it
  only as a known pending item.
- `legacy/frontend-antigo/` remains a tracked historical reference. Issue #15
  made no change under that path, and no active flow may depend on it.
- The stash named `pre-003-local-speckit-state-do-not-apply` remains preserved
  and must not be applied or deleted by this Issue.

## Feature 002 Audit (T083) — Issue #48

Audit of the existing feature 002 backend against
`specs/002-health-dashboard-chat/spec.md` before defining any integration
contract. Status uses `pass` (behavior implemented and covered), `partial`
(behavior implemented but not yet exposed as an HTTP contract for the separated
frontend), or `blocked` (missing capability). No endpoint, model, or enum value
is presumed: server actions and queries are **not** treated as HTTP contracts.

**Summary:** the feature 002 business rules are implemented as trusted
server-side Server Actions and queries and are covered by automated tests, so
the CR-009/FR-079 critical paths (ownership isolation, `CONSULTA`-not-history,
planned-care completion idempotency, chat authorization/archiving) are `pass`.
The consistent gap is the **HTTP contract layer** for the separated frontend:
only message polling is exposed today; health-center, operational-dashboard,
document, and chat send/list contracts are not yet defined or implemented.

| Area | Backend capability (real paths) | Rules verified | HTTP contract today | Status | Next contract task |
|------|----------------------------------|----------------|---------------------|--------|--------------------|
| Health Center | `lib/actions/cuidados-planejados.ts` (create CONSULTA, complete/reschedule/cancel), `lib/queries/health-dashboard.ts` (`getHealthOverview`, `getHealthAgenda`, `getAnimalHealthTimeline`) | Ownership via `responsibleSession`/`requireResponsible`+owner filter; completing `CONSULTA` never creates `RegistroSaude` (FR-017/FR-022); completion idempotent via `updateMany where PENDENTE`+`count===1` (FR-014); single planned occurrence upserted on `origemRegistroSaudeId` (FR-007/FR-012); timeline limited to the 5 history categories (FR-019/FR-020). Tests: `__tests__/actions/cuidados-planejados.test.ts`, `__tests__/queries/health-dashboard.test.ts`, `__tests__/queries/health-agenda.test.ts`. | **Absent.** Only feature 001 `/api/animais/gerenciados/[id]/saude` and `/api/saude/alertas` exist; no route wraps the agenda/overview/planned-care actions. | `partial` | T087/T091 (Issue #49) |
| Operational Dashboard | `lib/queries/operational-dashboard.ts` (`getOperationalDashboard`) | Owner-scoped metrics, funnel, prioritized pending, animal summary, recent activity from existing timestamps (FR-041/FR-046/FR-047/FR-048/FR-053). Test: `__tests__/queries/operational-dashboard.test.ts`. | **Absent.** No `GET /api/dashboard/...` responsible route (only `/api/dashboard/adotante`). | `partial` | T088/T092 (out of #49) |
| Health Documents | `lib/actions/documentos-saude.ts` (`deleteDocumentoSaude`, ownership); upload path via `documento-upload` + `/api/uploadthing`. | Ownership before delete; provider cleanup best-effort; internal-only (FR-037). Tests: `__tests__/actions/documentos-saude.test.ts`, `__tests__/actions/documento-upload.test.ts`. | **Partial.** Upload rides the shared `/api/uploadthing` route; list/delete are Server Actions with no dedicated HTTP contract. | `partial` | T089/T093 (out of #49) |
| Chat | `lib/actions/mensagens.ts` (`sendMensagem`, `markConversationRead`), `lib/queries/mensagens.ts` (`getConversationList`, `getConversationDetail`, `getUnreadMessageCount`) | Participant-only authorization; archived conversation blocks sends (FR-067); empty/2000-char rejection via `mensagemSchema` (FR-062/FR-063); per-participant read state (FR-065/FR-066). Tests: `__tests__/actions/mensagens.test.ts`, `__tests__/queries/mensagens-polling.test.ts`, `__tests__/actions/health-chat-dashboard-flow.test.ts`. | **Partial.** `GET /api/mensagens/[id]` polling exists; send and conversation list/detail are Server Actions with no HTTP contract. | `partial` | T090/T094 (out of #49) |

**Recorded gaps (not presumed capabilities):**
- No health-center, operational-dashboard, chat-send, or conversation-list HTTP
  route exists yet; these are gaps to be defined by T087-T090, not assumed.
- The frontend `TipoRegistroSaude` still exposes 3 of 5 categories (tracked under
  HEALTH-BASIC-01); feature 002 history uses all 5, so the frontend alignment in
  Issue #54 (T097) must add MEDICAMENTO_TRATAMENTO and PROCEDIMENTO.
- Result: feature 002 is cleared to proceed to contract definition; the
  health-center contract is the first slice (Issue #49).

**HEALTH-CENTER-01 (Issue #49, T087/T091): `backend ready`.** The health-center
HTTP contract is defined in `contracts/http-contract-inventory.md` and
implemented as thin route handlers over the existing action/query:
`GET /api/saude/visao-geral`, `GET /api/saude/agenda`, `POST /api/saude/cuidados`,
`POST /api/saude/cuidados/[id]/concluir`, and `PATCH|DELETE
/api/saude/cuidados/[id]`. Ownership, the `CONSULTA`-not-history rule and
completion idempotency are enforced by the underlying action and covered by
`__tests__/api/health-center.test.ts` (5 tests) plus the existing action/query
tests; full suite 191 tests green, backend `tsc` and targeted `eslint` clean.
Frontend consumption (Central de Saúde) remains Issue #55; the operational
dashboard, document, and chat contracts (T088-T090) stay out of this slice.

## Feature 002 Backend Certification (T095) - Issues #50-#53

The remaining audited feature 002 backend slices are individually
`backend ready`; this is not a frontend or end-to-end completion claim.

- **F002-DASHBOARD-01:** `OPERATIONAL-DASHBOARD-01` is implemented at
  `GET /api/dashboard/operacional`. The current account and responsible profile
  are revalidated before all aggregate sources are scoped to that owner.
- **F002-DOCUMENTS-01:** `HEALTH-DOCUMENTS-01` implements protected
  list/detail/delete routes and retains the existing UploadThing route. Reads,
  deletes and uploads revalidate current ownership; provider keys are not
  returned and sequential uploads use unique custom IDs.
- **F002-CHAT-01:** `ADOPTION-CHAT-01` implements participant-only
  list/detail/send/read routes and a safe polling DTO. Approval remains the only
  conversation creation path; completion archives the conversation, preserving
  readable history while send returns 409.
- **Validation evidence (2026-08-03):** focused suite 23/23, complete backend
  suite 208/208, backend typecheck, lint, Prisma schema validation and Next.js
  production build passed. The official frontend production build also passed
  without modifying `frontend/`; its existing bundle/plugin warnings remain
  non-blocking.
- **Database impact:** no schema, migration, seed, reset or database write was
  executed. Frontend audit, type alignment, consumption and per-flow mock
  removal remain T096-T106 / Issues #54-#59.
