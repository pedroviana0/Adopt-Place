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
| Authentication | `lib/auth.ts`, `lib/auth-credentials.ts`, `lib/actions/login.ts`, `lib/actions/auth-guards.ts` | Credentials login, NextAuth JWT session enrichment, current active-account revalidation, safe role/profile session DTO, and reusable session guards exist | Backend proof is complete, but root `/login` is not the public UI and `frontend/` still uses its mock session | Issue #22 must consume the real contract and prove cookie-backed reload/logout before AUTH-01 advances | Pedro | `backend ready` for AUTH-01 |
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
`contract defined`. AUTH-01 is `backend ready` because Issue #20 records the
contract and Issue #21 implements and validates its backend boundary. It does
not become `frontend integrated` or `flow complete` until the frontend work and
acceptance evidence in Issues #22/#23 are complete.

| Flow ID | Flow and current frontend behavior | Current real backend capability | Source of truth | Known gap and risk | Smallest next flow and HTTP contract inventory | Status and evidence |
|---------|------------------------------------|---------------------------------|-----------------|--------------------|------------------------------------------------|---------------------|
| AUTH-01 | Login, session, reload, logout, and protected-route identity. `frontend/src/lib/data/sessao.ts` authenticates against plaintext seed passwords and persists `adoptplace:session:v1`; `_authenticated.tsx` depends on that client-only state. | `lib/auth.ts` preserves NextAuth Credentials and JWT enrichment; `lib/auth-credentials.ts` validates credentials and blocks inactive accounts; `app/api/auth/[...nextauth]/route.ts` exports the protocol handlers; `app/api/session/route.ts` returns the protected allowlisted DTO after revalidating `Usuario.ativo`; auth guards/permissions remain available. | `Usuario`, NextAuth `Account`/`Session` models, `TipoPerfil`, `Usuario.ativo`, and the clarified secure-cookie session rule. | **Critical frontend gap remains**: backend authentication is proven, but reload, logout, redirect behavior, and mock/localStorage removal still depend on Issues #22/#23. | Arthur consumes the backend-ready session contract in Issue #22 without changing the DTO or accessing Prisma. Inventory group: **Session/login/logout**. | `backend ready`. Evidence: contract inventory; `app/api/session/route.ts`; `lib/auth-credentials.ts`; `__tests__/actions/auth-credentials.test.ts`; `__tests__/api/session.test.ts` (6 passing tests); T020-T022 and T024-T026; Issues #20/#21. |
| REG-01 | Adopter, organization, and foster registration routes call `cadastrar*` in `frontend/src/lib/data/usuarios.ts`, write users and plaintext passwords into the local DB, and set a fictitious session immediately. | `lib/actions/auth-register.ts` plus `lib/schemas/adotante.ts` implement only adopter registration with server validation, uniqueness checks, password hashing, and a Prisma transaction. | `Usuario`, `Adotante`, `Organizacao`, `AcolhedorIndependente`; unique e-mail, CPF, and CNPJ constraints. | **High**: organization and foster registration have no proven backend action or HTTP contract; frontend auto-login behavior is not a trusted rule. | Define separate evidence-backed registration DTOs without presuming missing organization/foster behavior. Inventory group: **Registration**. | `audited`. Evidence: `usuarios.ts`, registration routes, `auth-register.ts`, `adotante.ts`, and `schema.prisma`. |
| PROFILE-01 | `meu-perfil.tsx` and `dashboard.perfil.tsx` read mock profiles; organization/foster edits call `atualizarOrganizacao`/`atualizarAcolhedor` and persist to localStorage. CPF/CNPJ are intended as read-only in `frontend/INTEGRATION.md`. | No profile-edit action, query, schema, or HTTP route is proven. Session enrichment exposes only scoped IDs. `frontend/INTEGRATION.md` is planning input, not backend capability. | `Usuario`, `Adotante`, `Organizacao`, and `AcolhedorIndependente`; FR-009/FR-010 immutable identifier rule. | **High**: editable-field DTOs and e-mail uniqueness behavior are undefined. `fotoUrl` exists in frontend organization/foster types but not in the Prisma profiles, so it is a **lacuna/decisao pendente** requiring an explicit product decision and homologation before any schema change. | Define role-specific profile read/update contracts while leaving the profile-photo row pending. Inventory group: **Profile and screening**. | `audited`. Evidence: frontend profile routes/types, `frontend/INTEGRATION.md:52-66`, `lib/auth.ts`, and absent `fotoUrl` in `schema.prisma`. |
| SCREEN-01 | `_authenticated.triagem.tsx` calls `salvarTriagem` in `usuarios.ts`; answers and `triagemConcluida` persist in the local DB. | `lib/actions/triagem.ts`, `lib/schemas/adotante.ts`, and `lib/actions/request-guards.ts` save adopter screening and enforce completed screening before adoption requests. | Screening fields and `triagemConcluida` on `Adotante`; FR-013. | **High**: no authenticated HTTP DTO exists; request identity must come from the session, and screening answers are sensitive. | Define adopter-owned screening read/save plus owner request-review allowlists. Inventory group: **Profile and screening**. | `audited`. Evidence: `usuarios.ts:134-140`, triagem route, backend action/schema/guard, and request tests. |
| SHOWCASE-01 | `animais.ts` and `catalogos.ts` read seeded animals, photos, relationships, species, breeds, vaccines, and diseases. `index.tsx`, `vitrine.tsx`, and `animais.$animalId.tsx` render those values directly. | `lib/queries/animal-showcase.ts`, `public-animal.ts`, and `public-metrics.ts`, `lib/schemas/showcase.ts`, and `lib/tags.ts` provide public animal reads, filters, metrics, public health summary, and relationships. `getShowcaseFilterOptions` covers species/breeds; no HTTP route is proven. | `Animal`, `FotoAnimal`, `AnimalRelacionado`, `Especie`, `Raca`, and allowlisted `RegistroSaude`; `VacinaCatalogo`/`DoencaCatalogo` exist but public catalog reads are not proven. | **High**: HTTP methods/paths and DTO allowlists are undefined; vaccine/disease catalog behavior is a gap; public output must exclude contact, address, internal health, request, and chat data. | Expose one read-only vitrine/detail slice with a tested public allowlist. Inventory groups: **Public showcase** and **Public animal detail**. | `audited`. Evidence: T004 module/consumer audit, public queries/schema, and `public-animal.test.ts`. |
| FAVORITES-01 | `favoritos.ts` accepts an `adotanteId` from browser callers and mutates localStorage; favorites appear in `meus-favoritos.tsx` and animal detail. | `lib/actions/favoritos.ts`, `lib/queries/favorites.ts`, and `lib/schemas/favorito.ts` provide toggle/list behavior backed by Prisma. | Composite `Favorito(adotanteId, animalId)` relation and ADOTANTE-only rule FR-014. | **High**: no HTTP contract exists; adopter identity must be derived from the active session, not accepted from the browser. | Prove authenticated list/toggle persistence and non-adopter denial. Inventory group: **Favorites**. | `audited`. Evidence: `favoritos.ts`, backend action/query/schema, `permissions.ts`, and Prisma composite key. |
| REQUEST-ADOPTER-01 | `solicitacoes.ts` creates requests and changes animal/request state in the browser; adopter routes list mock requests and dashboard counts. | `lib/actions/solicitacoes.ts`, `request-guards.ts`, `lib/queries/adopter-requests.ts`, `adotante-dashboard.ts`, and request schemas implement real creation guards and reads. | `SolicitacaoAdocao`, `Animal`, `Adotante`, `StatusSolicitacao`, and screening/availability/duplicate rules. | **Critical**: no adopter HTTP contracts; browser-supplied IDs cannot be trusted; current frontend executes business transitions locally. | Prove one screened-adopter request flow with duplicate and unavailable-animal denial. Inventory group: **Adopter requests**. | `audited`. Evidence: `solicitacoes.ts`, adopter routes, backend guards/actions/queries, and `solicitacoes.test.ts`. |
| REQUEST-OWNER-01 | Responsible dashboards call mock list/detail/decision/completion functions from `solicitacoes.ts`; approval and completion mutate competing requests and animal status client-side. | `lib/actions/solicitacoes.ts`, `lib/queries/owner-requests.ts`, `owner-request-detail.ts`, `completed-adoptions.ts`, and decision schemas implement ownership checks and transactional approval/completion. | `SolicitacaoAdocao`, `Animal`, conversation entities, and the APROVADA/RECUSADA/CONCLUIDA transition rules. | **Critical**: owner-scoped list/detail/decision HTTP contracts are missing; private screening data needs a narrow read-only DTO; transactional rules must stay backend-only. | Prove owner-only request review and one transactional decision. Inventory group: **Owner request review**. | `audited`. Evidence: dashboard request routes, backend actions/queries/schemas, `owner-requests.test.ts`, and `solicitacoes.test.ts`. |
| ANIMALS-01 | `animais.ts` performs public/owner reads, CRUD, photo replacement/removal, and bidirectional relationships in localStorage. `frontend/src/lib/upload.ts` stores compressed base64 images in the same DB blob. | Animal, photo, relationship, and search actions; `lib/queries/owned-animals.ts`; related Zod schemas; `lib/upload-router.ts`; and Uploadthing route provide owner-checked real capabilities. | `Animal`, `FotoAnimal`, `AnimalRelacionado`, responsible profile ownership, species/breed relations, and XOR responsible rule. | **Critical**: owner CRUD/photo/relationship/search HTTP contracts are missing; frontend types accept broad partial updates; upload cookie and response DTO behavior are unproven. | Define and validate owner-scoped CRUD first, then photo/upload, relationship, and search slices. Inventory groups: **Animal management** and **Uploads**. | `audited`. Evidence: `animais.ts`, owner animal routes/components, backend actions/query/schemas/upload router, and animal/relationship/upload tests. |
| HEALTH-BASIC-01 | `saude.ts` creates/deletes three mock health categories and derives alerts locally; `HealthPanel.tsx` and animal/dashboard routes consume them. | `lib/actions/registro-saude.ts`, `lib/queries/procedure-alerts.ts`, `lib/schemas/registro-saude.ts`, and ownership helpers support five completed clinical categories and future-care linkage. | `RegistroSaude`, `TipoRegistroSaude`, owned `Animal`, and FR-017/FR-018. | **Critical**: frontend health enum is narrower than Prisma; no owner-scoped HTTP contract exists; internal notes and professional/clinic data must remain private. | Prove one owned completed-health-record flow and alert read without exposing internal fields. Inventory group: **Health records and agenda**. | `audited`. Evidence: `saude.ts`, `HealthPanel.tsx`, backend action/query/schema, and `registro-saude.test.ts`. |
| F002-HEALTH-01 | No complete dedicated Central de Saude data module or route is proven in the active frontend; existing health UI is based on `saude.ts` mock records/alerts. | `lib/actions/cuidados-planejados.ts`, `lib/queries/health-dashboard.ts`, and planned-care schemas support agenda, overview, timeline, reschedule/cancel/complete, including CONSULTA. | `CuidadoPlanejado`, `RegistroSaude`, their enums/relations, and the rule that CONSULTA never becomes clinical history. | **Critical**: feature 002 audit T083 is mandatory before contract definition; dedicated frontend surface and DTO alignment are gaps. | Audit feature 002, then define one health-center contract that preserves CONSULTA exclusion and idempotency. Inventory group: **Health records and agenda**. | `audited`. Evidence: backend files/tests exist; frontend gap recorded by plan and T004. No completion claim. |
| F002-DASHBOARD-01 | `_authenticated.dashboard.index.tsx` calculates mock metrics from local arrays and can render zeroed owner metrics for ADMIN. | `lib/queries/operational-dashboard.ts` computes owner-scoped indicators; `adotante-dashboard.ts` provides adopter metrics. | Real aggregates over owned animals, requests, care, health, and conversations; FR-020. | **High**: operational dashboard HTTP DTO is undefined; role-specific dashboard boundaries and ADMIN behavior remain unresolved. | Audit feature 002, then expose one owner-scoped dashboard read DTO. Inventory group: **Dashboards**. | `audited`. Evidence: route audit F4, dashboard queries, and `operational-dashboard.test.ts`. |
| F002-DOCUMENTS-01 | No dedicated health-document route/data module is proven; image helpers only persist base64 values in localStorage. | `lib/actions/documentos-saude.ts`, `lib/queries/documentos-saude.ts`, document schemas, `lib/upload-router.ts`, and Uploadthing route implement owned metadata/upload/delete behavior. | `DocumentoSaude`, owned `Animal`, optional `RegistroSaude`, and private-document rule. | **Critical**: frontend UI is a gap; list/detail/upload/delete contracts and URL exposure rules are undefined. | Audit feature 002, then define one owner-scoped document metadata/upload flow. Inventory groups: **Health documents** and **Uploads**. | `audited`. Evidence: backend files and document privacy/upload tests; no frontend integration evidence. |
| F002-CHAT-01 | No dedicated chat route/data module is proven in `frontend/`; request mocks do not provide a real participant-scoped conversation. | Adoption transitions create/archive conversations; `lib/actions/mensagens.ts`, `lib/queries/mensagens.ts`, message schema, and `app/api/mensagens/[id]/route.ts` support participant reads/sends/read markers and polling. | `ConversaAdocao`, `ConversaParticipante`, `MensagemAdocao`, request approval, and archived read-only rules. | **Critical**: only polling is a concrete route; list/detail/send/read DTOs are undefined; feature 002 audit is mandatory; ADMIN has no automatic access. | Audit feature 002, then prove participant-only chat after approval and read-only after completion. Inventory group: **Chat**. | `audited`. Evidence: backend route/actions/queries/tests; active frontend route/component gap. |
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
what the frontend now does and how to validate it; they **do not** promote the
matrix status. The session row stays `backend ready` until Pedro/Codex records
`flow complete` in T030 after reviewing this evidence and the homologation run.

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

**Acceptance checks (manual, homologation — SC-006 login/session/logout):**

| # | Step | Expected result |
|---|------|-----------------|
| 1 | Login with a valid active account | `POST /api/auth/callback/credentials` sets the cookie; `GET /api/session` returns 200; UI navigates to `next` or `/`. |
| 2 | Refresh/reload while logged in | `GET /api/session` returns 200 from the cookie; session persists with **no** localStorage entry. |
| 3 | Logout | `POST /api/auth/signout` clears the cookie; `GET /api/session` then returns 401; UI returns to `/`. |
| 4 | Open a protected route without a session | `_authenticated` guard redirects to `/login?next=<path>`. |
| 5 | Invalid credentials | Generic `E-mail ou senha inválidos` (no account-existence leak). |
| 6 | Inactive account | Blocked; `GET /api/session` returns 403 `INACTIVE_ACCOUNT` with `Conta desativada. Entre em contato com o administrador`. |

**Known limitations recorded (not resolved by assumption):**

- SessionDTO excludes `nome`/`fotoUrl`; the frontend shows the e-mail as display
  name until the profile contract (Issue #30). No name/photo endpoint is invented.
- Login-time inactive blocking relies on NextAuth error masking, so step 5/6 may
  both surface the generic message at login; the authoritative inactive block and
  exact message are proven by the `GET /api/session` 403 (Issue #21 tests).
- SSR session (server-side cookie forwarding) is out of scope; the F1 SSR-flash
  defect remains tracked under ROUTES-01 / T033.

**Executed validation (this PR):** `npm --prefix frontend run lint` and
`npm --prefix frontend run build`. Live login/refresh/logout require both servers
plus a homologation database and are recorded here as manual acceptance steps,
not run against the original database.

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

## Preserved Pending and Historical State

- Feature 001 T104 was read at
  `specs/001-animal-adoption-management/tasks.md:260` and remains
  `- [ ] T104 Execute manual acceptance checklist...`. This matrix records it
  only as a known pending item.
- `legacy/frontend-antigo/` remains a tracked historical reference. Issue #15
  made no change under that path, and no active flow may depend on it.
- The stash named `pre-003-local-speckit-state-do-not-apply` remains preserved
  and must not be applied or deleted by this Issue.
