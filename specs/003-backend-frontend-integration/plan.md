
# Implementation Plan: Backend Frontend Integration

**Branch**: `003-backend-frontend-integration` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-backend-frontend-integration/spec.md`

## Summary

Integrate the official Lovable frontend in `frontend/` with the real backend preserved at the repository root. The public product surface will be the TanStack Start/Vite frontend, published separately but preferably served through same-origin routing or a reverse proxy. The root Next.js app becomes the backend/service layer responsible for NextAuth, authenticated HTTP contracts, validation, authorization, Prisma, and PostgreSQL access.

The first delivery is documentation only: baseline audit, frontend-to-backend matrix, and HTTP contract inventory for every flow. Later implementation must proceed through small Pull Requests and related backend/frontend Issues, beginning with a technical proof of real authentication and session handling.

## Technical Context

**Language/Version**: TypeScript 5.x strict. Backend root uses Next.js 15 App Router. Official frontend uses TanStack Start/Vite under `frontend/`.

**Primary Dependencies**: Backend root uses NextAuth v5, Prisma 5.x, Zod 3.x, Uploadthing, React, Tailwind CSS, shadcn/ui primitives, and Vitest. `frontend/` uses TanStack Start/Router, Vite, React Query, React Hook Form, Zod, Radix/shadcn-style UI components, and local mock data modules.

**Storage**: PostgreSQL 16 through Prisma Client from the backend root only. `frontend/` must never access Prisma or PostgreSQL directly. The current schema already includes feature 001 and feature 002 entities, including health documents, planned care, adoption conversations, messages, and participants.

**Testing**: Backend validation commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, `npm run build`. Frontend validation commands: `npm --prefix frontend run lint`, `npm --prefix frontend run build`. Do not run seed, reset, or migrations against the original database during this feature; database changes must be validated in homologation.

**Target Platform**: Two deployable web applications: public TanStack Start/Vite frontend in `frontend/`, and root Next.js backend/service layer.

**Project Type**: Web application integration across separated frontend and backend surfaces in one repository.

**Performance Goals**: Keep public vitrine and route rendering visibly responsive under feature 001 targets; contract calls should support ordinary page interactions without client-side full-database loading. Chat polling remains bounded by the existing backend route behavior and must not introduce WebSocket or custom realtime infrastructure without later proof of need.

**Constraints**: Preserve NextAuth; prefer secure cookie session with same-origin or reverse proxy; do not replace NextAuth with custom JWT. All real operations pass through authenticated backend HTTP contracts. Use DTOs, never raw Prisma model payloads, for frontend-facing contracts. Do not expose private adopter, internal health, document, request, or chat data through public contracts. Remove mocks module by module only after the equivalent real flow works.

**Scale/Scope**: Covers all active frontend data modules in `frontend/src/lib/data/`, all primary route groups in `frontend/src/routes/`, and backend capabilities currently present in `app/api`, `lib/actions`, `lib/queries`, `lib/schemas`, `lib/auth.ts`, `lib/permissions.ts`, `lib/upload-router.ts`, and `prisma/schema.prisma`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero over-engineering**: PASS. The plan starts with audit and matrix, then exposes direct HTTP contracts over existing backend actions/queries. No generic service layer, repository pattern, event bus, custom auth framework, or broad rewrite is planned.
- **Schema first**: PASS. `prisma/schema.prisma` remains the source of truth. No model change is planned for the documentation-first delivery. If the audit finds a proven schema gap, a later backend Issue must validate it in homologation before any migration touches the original database.
- **Server-side by default**: PASS. Business rules remain in the backend root using existing server-side actions, queries, permissions and route handlers. `frontend/` receives DTOs and handles UI state only.
- **Proactive security**: PASS. Every protected contract must authenticate through NextAuth session and check active account, role, ownership or chat participation before selecting or mutating protected data. Public contracts must select only explicitly public DTO fields.
- **Two-layer validation**: PASS. Backend contracts must validate inputs with existing Zod schemas or narrowly extended schemas. Frontend forms may keep client validation for UX but cannot be the security boundary.
- **Minimal client state**: PASS. `frontend/` state is limited to forms, filters, navigation state, tabs, dialogs, uploading/sending state and display refresh. Product data must not remain persisted only in localStorage after a module is integrated.
- **No unnecessary dependencies**: PASS. Existing stacks cover HTTP, auth, validation, data access, upload and tests. No dependency is planned.
- **TypeScript strict**: PASS. DTOs must be typed from Prisma-backed shapes or narrow schema-derived types. Explicit `any` remains forbidden.
- **Test-first for critical paths**: PASS. Authorization, ownership, account-active checks, adoption transitions, health-history constraints, chat release and chat archiving require failing automated tests before implementation tasks are accepted.

## Project Structure

### Documentation (this feature)

```text
specs/003-backend-frontend-integration/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- integration-matrix.md  # mandatory first-delivery synchronization artifact
|-- contracts/
|   `-- http-contract-inventory.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/api/
|-- auth/[...nextauth]/route.ts      # existing NextAuth route
|-- mensagens/[id]/route.ts          # existing authorized polling route
`-- uploadthing/route.ts             # existing Uploadthing route
lib/
|-- auth.ts                          # NextAuth config and getServerSession()
|-- permissions.ts                   # active session, role, ownership, chat access helpers
|-- prisma.ts                        # Prisma Client, backend-only
|-- actions/                         # existing trusted mutations
|-- queries/                         # existing server-side reads
|-- schemas/                         # existing Zod validation
|-- upload-router.ts
`-- tags.ts
prisma/
|-- schema.prisma
|-- migrations/
`-- seed.ts                          # do not run against original DB for this feature
__tests__/
|-- actions/
|-- queries/
|-- schemas/
`-- setup.ts
frontend/
|-- package.json                     # TanStack Start/Vite public app
|-- INTEGRATION.md                   # existing integration notes and mock boundary
`-- src/
    |-- lib/data/                    # current mock/localStorage boundary to replace by module
    |-- lib/domain/                  # frontend types/enums mirroring backend concepts
    |-- routes/                      # active public and authenticated frontend routes
    `-- components/app/              # active UI components
legacy/frontend-antigo/              # historical reference only; no new functionality
```

**Structure Decision**: Keep two applications. `frontend/` is the official public UI. The root app is the backend/service layer and no longer counts as a public UI. Existing visual routes in the root are currently absent from `app/`; if any are reintroduced or discovered later, planning must decide whether to ignore, protect, or redirect them rather than keep a second public interface.

## Phase Plan

### Phase 1 - Baseline and Audit

Goal: establish the integration baseline without changing behavior.

Pedro/Codex:
- Verify branch, status, `.specify/feature.json`, and feature 003 docs.
- Inventory backend surfaces: `app/api/*`, `lib/auth.ts`, `lib/permissions.ts`, `lib/actions/*`, `lib/queries/*`, `lib/schemas/*`, `lib/upload-router.ts`, `prisma/schema.prisma`, and existing tests.
- Confirm no seed, reset, or migration is executed against the original database.

Arthur/Claude:
- Inventory active frontend routes, screens, navigation and URL-change/no-render bugs.
- Inventory `frontend/src/lib/data/*.ts` mock modules and localStorage/session usage.

Deliverable: create `integration-matrix.md` and populate its baseline audit section with evidence paths and no implementation.

### Phase 2 - Matrix Frontend to Backend

Goal: complete and populate the synchronization artifact created during the baseline audit.

Rows must cover `sessao.ts`, `usuarios.ts`, `catalogos.ts`, `animais.ts`, `favoritos.ts`, `solicitacoes.ts`, `saude.ts`, feature 002 areas, every primary route in `frontend/src/routes/`, and route rendering. Each row records frontend module/route, current mock behavior, backend source file/query/action/schema, DTO needed, contract status, owner side, related backend/frontend Issue pair, each owner, affected files or areas, dependency, execution order, acceptance criteria, risk, and status: audited, contract defined, backend ready, frontend integrated, or flow complete. During the documentation delivery, the matrix records the required Issue pairs but does not create GitHub Issues.

### Phase 3 - API Contracts

Goal: document HTTP contracts before implementation.

Constraints:
- Existing concrete endpoints today are `app/api/auth/[...nextauth]/route.ts`, `app/api/mensagens/[id]/route.ts`, and `app/api/uploadthing/route.ts`.
- New contract paths must be designed in later backend Issues from the inventory; this plan does not create or name final new endpoints as fact.
- Every contract returns DTOs, not raw Prisma models.
- Public contracts use allowlisted public fields only.
- Protected contracts use NextAuth session, active account checks, role checks and ownership/participant checks before data access.
- A flow implementation cannot start until its matrix row contains contract evidence and is explicitly marked `contract defined`.
- Missing paths, models or capabilities remain gaps or pending decisions; the inventory must not invent them.

Contract groups to inventory: auth/session, public vitrine, public animal detail, registration, profile, screening, favorites, adopter requests, owner requests, animals/photos/relationships, health, documents, dashboards, chat and admin users.

**Mandatory documentation gate**: the baseline audit, `integration-matrix.md`, and `contracts/http-contract-inventory.md` must be completed and verified before any Phase 4-14 implementation task begins. The later phases in this plan describe future work and do not bypass this gate.

### Phase 4 - Authentication Proof

Goal: first implementation Issue after documentation.

Pedro/Codex owns backend proof:
- Preserve NextAuth and current credentials behavior in `lib/auth.ts`.
- Expose a minimal authenticated session contract returning a safe session DTO compatible with frontend concepts.
- Validate active account and role mapping.
- Prefer same-origin or reverse proxy for cookie simplicity; cross-origin requires explicit cookie/CORS design before coding.

Arthur/Claude owns frontend proof:
- Replace only `frontend/src/lib/data/sessao.ts` behavior after backend contract is ready.
- Remove localStorage session persistence for this flow only when real session works.

Tests: valid login, invalid credentials, inactive account block, session DTO shape, no sensitive fields, reload/logout/protected-route redirect.

### Phase 5 - Route Corrections

Goal: ensure `frontend/` navigation renders expected screens.

Arthur/Claude owns route fixes in `frontend/src/routes/*` and navigation components. Pedro/Codex documents backend dependencies and validates protected route assumptions. Do not use root visual routes as fallback UI. Fix URL-changing/no-render bugs before marking the affected flow complete.

### Phase 6 - Public Showcase

Goal: replace public animal browsing mocks with real public DTOs.

Backend likely affected: `lib/queries/animal-showcase.ts`, `public-animal.ts`, `public-metrics.ts`, `lib/schemas/showcase.ts`, `lib/tags.ts`, future public HTTP route handlers.

Frontend likely affected: `frontend/src/lib/data/animais.ts`, `catalogos.ts`, `frontend/src/routes/index.tsx`, `vitrine.tsx`, `animais.$animalId.tsx`, `AnimalCard.tsx`, `AnimalFilters.tsx`, `HealthPanel.tsx`, `RelatedAnimalsPanel.tsx`.

Tests: public data exposure, filters, empty state, pagination, no private fields in public DTOs.

### Phase 7 - Profiles and Screening

Goal: real registration, profile editing and adopter screening.

Backend likely affected: `lib/actions/auth-register.ts`, `lib/actions/triagem.ts`, `lib/schemas/adotante.ts`, auth/session DTO mapping, future profile HTTP contracts. The frontend expectation of profile photos for Organização and AcolhedorIndependente is not proven by `prisma/schema.prisma`; the matrix must mark it as `lacuna/decisão pendente`, not `contract defined`. A product decision and homologation validation are required before any schema change, and no migration may run against the original database during this documentation work.

Frontend likely affected: `frontend/src/lib/data/usuarios.ts`, `frontend/src/routes/cadastro.*.tsx`, `_authenticated.triagem.tsx`, `_authenticated.meu-perfil.tsx`, `_authenticated.dashboard.perfil.tsx`.

Tests: registration uniqueness, inactive account, screening required, immutable CPF/CNPJ, profile e-mail uniqueness.

### Phase 8 - Adopter Journey

Goal: real favorites, adopter requests, request status and adopter dashboard.

Backend likely affected: `lib/actions/favoritos.ts`, `lib/actions/solicitacoes.ts`, `lib/actions/request-guards.ts`, `lib/queries/favorites.ts`, `adopter-requests.ts`, `adotante-dashboard.ts`, `lib/schemas/favorito.ts`, `solicitacao.ts`.

Frontend likely affected: `frontend/src/lib/data/favoritos.ts`, `solicitacoes.ts`, `_authenticated.meus-favoritos.tsx`, `_authenticated.minhas-solicitacoes.tsx`, `_authenticated.dashboard.index.tsx`, public animal request/favorite actions.

Tests: triagem required, duplicate active request, unavailable animal block, adopter-only favorites, reload/logout persistence.

### Phase 9 - Animal Management

Goal: real responsible-user animal management, photos and relationships.

Backend likely affected: `lib/actions/animais.ts`, `fotos.ts`, `animal-relacionado.ts`, `animal-search.ts`, `lib/queries/owned-animals.ts`, `lib/schemas/animal.ts`, `foto-animal.ts`, `animal-relacionado.ts`, `lib/upload-router.ts`, `app/api/uploadthing/route.ts`.

Frontend likely affected: `frontend/src/lib/data/animais.ts`, `_authenticated.dashboard.animais.*.tsx`, `AnimalForm.tsx`, `RelatedAnimalsPanel.tsx`.

Tests: ownership isolation, XOR responsible owner, photo primary/ordering, self-link rejection, bidirectional link/unlink, upload authorization.

### Phase 10 - Health and Requests

Goal: integrate existing feature 001 health records and owner request decision flows.

Backend likely affected: `lib/actions/registro-saude.ts`, `lib/actions/solicitacoes.ts`, `lib/queries/owner-requests.ts`, `owner-request-detail.ts`, `procedure-alerts.ts`, `lib/schemas/registro-saude.ts`, `solicitacao-decisao.ts`.

Frontend likely affected: `frontend/src/lib/data/saude.ts`, `solicitacoes.ts`, `_authenticated.dashboard.solicitacoes.*.tsx`, `_authenticated.dashboard.animais.$animalId.tsx`, `HealthPanel.tsx`, `TriagemReadOnly.tsx`.

Tests: owner-only request review, approval cascade, refusal behavior, adoption completion preconditions, health date validation, no adopter/visitor health mutation.

### Phase 11 - Dashboard, Documents and Chat

Goal: audit and integrate feature 002 areas only after proving current backend behavior.

Backend likely affected: `lib/queries/health-dashboard.ts`, `operational-dashboard.ts`, `documentos-saude.ts`, `mensagens.ts`, `lib/actions/cuidados-planejados.ts`, `documentos-saude.ts`, `mensagens.ts`, `app/api/mensagens/[id]/route.ts`, `lib/schemas/cuidado-planejado.ts`, `documento-saude.ts`, `dashboard-filters.ts`, `mensagem.ts`.

Frontend likely affected: exact route/component gaps must be recorded first. Current inspected frontend data modules do not expose complete dedicated documents/chat modules, so the matrix must drive frontend Issues before implementation.

After Pedro audits feature 002 and defines its real contracts, Arthur must align frontend types and enums for health, dashboard, documents, and chat to those audited contracts. Frontend types must not duplicate divergent enums or presume values absent from the Prisma-backed source of truth.

Tests: CONSULTA never becomes clinical history, planned care idempotency, document privacy, dashboard ownership isolation, chat only after approval, archived chat read-only, no admin automatic chat access.

### Phase 12 - Administration

Goal: real admin user list and activation/deactivation.

Backend likely affected: `lib/actions/admin-users.ts`, `lib/queries/admin-users.ts`, `lib/schemas/admin-user.ts`, future admin HTTP contracts.

Frontend likely affected: `frontend/src/lib/data/usuarios.ts`, `_authenticated.dashboard.admin.usuarios.tsx`, admin navigation.

Tests: admin-only access, active/inactive transitions, inactive account login/use blocked, no password/hash exposure.

### Phase 13 - Final Mock Removal

Goal: remove remaining per-flow mock/localStorage dependence only after real flow completion.

Rules:
- Remove mocks module by module, not globally at the start.
- Keep seed data only for development demonstration, not runtime source of truth.
- `frontend/src/lib/data/db.ts` and `seed.ts` are not removed until all dependent modules are complete or explicitly isolated as dev-only fixtures.
- Browser storage clearing must not erase product data for completed flows.

### Phase 14 - End-to-End Homologation

Goal: validate the integrated product in a safe environment.

Rules:
- Do not run seed, reset, or migration against the original database.
- Any schema change discovered during integration must be tested in homologation first.
- Use representative accounts for adopter with screening, adopter without screening, organization, foster and admin.
- Manually time these selected small flows for SC-006: login/session reload/logout, public showcase filter-to-detail, profile edit, screening-to-request, responsible request decision, animal create-or-edit, health record operation, dashboard review, health-document access, approved/read-only chat, and admin activation/deactivation.
- Record for each timed flow its role, start/end timestamps, elapsed time, environment, result, and evidence reference in the matrix or homologation checklist. Each must finish in under 3 minutes; no automated duration test is required.

Validation commands:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run prisma:validate`
- `npm run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

## Division of Work

Pedro/Codex owns backend, contracts, security, specs, tasks and validations: `app/api/*`, future backend route handlers, `lib/auth.ts`, `lib/permissions.ts`, `lib/actions/*`, `lib/queries/*`, `lib/schemas/*`, `lib/upload-router.ts`, `lib/tags.ts`, `prisma/*` only after homologation approval, and `__tests__/*`.

Arthur/Claude owns active frontend adaptation: `frontend/src/lib/data/*`, `frontend/src/lib/domain/*` when DTO alignment requires it, `frontend/src/routes/*`, `frontend/src/components/app/*`, route generation files as needed, and frontend-side integration notes.

No new functionality goes into `legacy/frontend-antigo/*`.

## API Contract Strategy

- Start from `contracts/http-contract-inventory.md`.
- Treat `contract defined` in the corresponding matrix row as a hard prerequisite for implementation.
- Keep exact new endpoint paths out of the matrix until a backend Issue defines them.
- Every contract states auth mode: public, authenticated, role-scoped, owner-scoped, participant-scoped, or admin-only.
- Every response is a DTO allowlist. Do not serialize Prisma models directly.
- Every mutation defines input schema, output/error shape, authorization checks, and critical tests before implementation.
- Same-origin/proxy deployment is the preferred assumption for NextAuth cookies. Cross-origin deployment requires a specific cookie/CORS decision before coding.

## Branch and Pull Request Strategy

- Keep `003-backend-frontend-integration` for Spec Kit planning artifacts.
- Use small implementation branches from updated `main`, one per small backend or frontend Issue.
- For flows touching both sides, create two related Issues: backend contract/validation first, frontend consumption second.
- Merge backend contract PRs before frontend mock-removal PRs for the same flow.
- Each PR updates the integration matrix row status and includes relevant validation commands.
- Avoid mixed PRs that change backend contracts, frontend UI, schema and mock removal all at once.

## Risks

- **Cookie/session mismatch**: separated deployment can break NextAuth cookies. Mitigation: prefer same-origin or reverse proxy; prove auth/session first.
- **DTO drift**: frontend types mirror backend concepts but are not generated from Prisma. Mitigation: document DTOs and validate contract shape in tests.
- **Security regression**: rich entities can leak CPF, CNPJ, address, screening, internal health or chat data. Mitigation: allowlisted selects and public exposure tests.
- **Two active UIs**: root visual routes could conflict with `frontend/`. Mitigation: root is service-only; root visual routes ignored/protected/redirected by later planning.
- **Mock residue**: localStorage data may hide missing backend work. Mitigation: flow completion requires mock/localStorage removal for that flow.
- **Schema changes on real DB**: integration may reveal missing fields. Mitigation: homologation-only migration testing before original DB changes.
- **Feature 002 false positives**: dashboard/health/chat may look present but not satisfy specs. Mitigation: audit every feature 002 acceptance scenario before marking complete.

## Complexity Tracking

No constitution violations are planned.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
