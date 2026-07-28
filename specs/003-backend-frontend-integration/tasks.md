# Tasks: Backend Frontend Integration

**Input**: Design documents from `/specs/003-backend-frontend-integration/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/http-contract-inventory.md`, `quickstart.md`

**Governance**: Only Pedro/Codex may maintain and mark this `tasks.md`. Arthur/Claude may execute tasks assigned to Arthur, but must not edit this file. T104 from feature 001 remains a known pending item and must not be changed here.

**Tests**: Critical paths must create failing tests before implementation: authentication/session, 401 without session, inactive user block, role/ownership authorization, adoption transitions, health-history CONSULTA rule, chat release/archive, and private-data exposure.

**Organization**: Tasks are grouped by the 14 planned phases. Each executable task is small enough to become or map to one GitHub Issue. Shared flows are split into backend and frontend tasks with explicit dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Only tasks that can run in parallel because they touch different files and do not depend on incomplete tasks.
- **[Story]**: User story label from `spec.md` for story phases.
- **Owner**: Every task says `Owner: Pedro` or `Owner: Arthur`.

## Mandatory Documentation Gate

T001 through T019 MUST be completed and verified before any implementation task in Phase 4 or later begins. This gate requires the baseline audit, `specs/003-backend-frontend-integration/integration-matrix.md`, and `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`. The presence of later phases in this file does not authorize implementation before the gate closes. In every later flow, implementation also requires its corresponding matrix row to contain contract evidence and the explicit status `contract defined`.

## Phase 1: Baseline and Audit (Shared Setup)

**Purpose**: Produce the initial audit baseline without implementation.

- [X] T001 Confirm branch, working tree, `.specify/feature.json`, and existing stash state; record result in `specs/003-backend-frontend-integration/quickstart.md` (Owner: Pedro)
- [X] T002 Create `specs/003-backend-frontend-integration/integration-matrix.md` with the required audit fields and statuses `audited`, `contract defined`, `backend ready`, `frontend integrated`, and `flow complete` before any task writes audit evidence (Owner: Pedro; depends on T001)
- [X] T003 Audit backend real surfaces in `app/api/`, `lib/auth.ts`, `lib/permissions.ts`, `lib/actions/`, `lib/queries/`, `lib/schemas/`, `lib/upload-router.ts`, `prisma/schema.prisma`, and `__tests__/`; record evidence in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T002)
- [X] T004 Audit frontend mock/localStorage modules in `frontend/src/lib/data/` and route usage in `frontend/src/routes/`; record evidence in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur; depends on T002)
- [X] T005 Audit route rendering problems where `frontend/src/routes/` changes URL without rendering the expected screen; record route, trigger, expected screen, and observed behavior in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur; depends on T004)
- [X] T006 Audit feature 001 T104 status in `specs/001-animal-adoption-management/tasks.md` and record only that it remains pending in `specs/003-backend-frontend-integration/integration-matrix.md` without editing feature 001 (Owner: Pedro; depends on T002)
- [X] T007 Audit that `legacy/frontend-antigo/` remains historical only and record no-new-functionality rule in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T002)

**Checkpoint**: Initial audit evidence exists before any contract or implementation task starts.

## Phase 2: Matrix Frontend -> Backend (Foundational)

**Purpose**: Complete and populate the synchronization artifact created in Phase 1 so it can block implementation for each flow.

- [X] T008 Map `frontend/src/lib/data/sessao.ts` to `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [X] T009 Map `frontend/src/lib/data/usuarios.ts` and profile/registration routes to `lib/actions/auth-register.ts`, `lib/actions/triagem.ts`, `lib/schemas/adotante.ts`, and profile schema gaps in `specs/003-backend-frontend-integration/integration-matrix.md`; record the unproven Organização/Acolhedor profile-photo expectation as `lacuna/decisão pendente`, requiring a product decision and homologation validation before any schema change, without creating a migration or changing the original database (Owner: Pedro)
- [X] T010 Map `frontend/src/lib/data/animais.ts` and `frontend/src/lib/data/catalogos.ts` to public and owner animal queries/actions in `lib/queries/` and `lib/actions/` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [X] T011 Map `frontend/src/lib/data/favoritos.ts` and `frontend/src/lib/data/solicitacoes.ts` to favorites and adoption request backend files in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [X] T012 Map `frontend/src/lib/data/saude.ts` and feature 002 gaps to `lib/actions/registro-saude.ts`, `lib/actions/cuidados-planejados.ts`, `lib/actions/documentos-saude.ts`, `lib/actions/mensagens.ts`, and related queries in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [X] T013 Document in `specs/003-backend-frontend-integration/integration-matrix.md` the required related backend/frontend Issue pair for every two-sided flow, including each owner, affected files or areas, dependency, execution order, and acceptance criteria; create placeholders only and do not create GitHub Issues (Owner: Pedro)
- [X] T014 Review matrix rows with Arthur/Claude ownership and record frontend-only gaps without changing `frontend/` code in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur; depends on T008-T013)

**Checkpoint**: No flow can receive implementation tasks until its matrix row exists.

## Phase 3: API Contracts (Foundational)

**Purpose**: Define HTTP contract inventory before endpoint implementation.

- [X] T015 Define contract documentation template fields in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`: method/path, auth mode, request DTO, response DTO, excluded sensitive fields, tests, backend source, frontend dependency (Owner: Pedro)
- [X] T016 Define public DTO allowlist rules for vitrine, animal detail, metrics, catalog data, and sensitive-field exclusions in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` (Owner: Pedro)
- [X] T017 Define protected DTO allowlist rules for session, profile, screening, favorites, requests, owner animals, health, dashboard, chat, and admin users in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` (Owner: Pedro)
- [X] T018 Define the exact first authentication proof contracts that reuse or extend `app/api/auth/[...nextauth]/route.ts` behavior, record the chosen paths in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`, and mark the corresponding matrix row `contract defined` only with contract evidence (Owner: Pedro)
- [X] T019 Audit whether same-origin/proxy assumptions require backend config changes in `next.config.ts`, `frontend/vite.config.ts`, or deployment docs; record decision in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` (Owner: Pedro)

**Checkpoint**: Auth proof can start only after T018 and T019.

## Phase 4: Authentication Proof (User Story 2 - P1)

**Goal**: Validate real login, session after reload, logout, 401 without session, and inactive-user block.

**Independent Test**: With real backend auth, login succeeds for active users, session survives page refresh, logout clears access, unauthenticated contract access returns 401, and inactive users are blocked.

### Tests for User Story 2

- [X] T020 [US2] Add failing backend test for valid login/session DTO and no sensitive fields in `__tests__/actions/auth-guards.test.ts` or a new auth contract test file recorded in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` (Owner: Pedro)
- [X] T021 [US2] Add failing backend test for 401 without session on the selected protected auth-proof contract in `__tests__/actions/auth-guards.test.ts` or the contract test file from T020 (Owner: Pedro; depends on T020)
- [X] T022 [US2] Add failing backend test for inactive user block with message `Conta desativada. Entre em contato com o administrador` in `__tests__/actions/auth-guards.test.ts` (Owner: Pedro; depends on T021)
- [X] T023 [P] [US2] Add frontend acceptance notes for login, refresh-session, logout, and protected-route redirect in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur)

### Implementation for User Story 2

- [X] T024 [US2] Implement the backend auth-proof contract selected in T018 using `lib/auth.ts`, `lib/permissions.ts`, and the existing `app/api/auth/[...nextauth]/route.ts` boundary or documented route from T018 (Owner: Pedro; depends on T018-T022 and requires the session matrix row at `contract defined`)
- [X] T025 [US2] Validate the backend auth-proof contract returns DTOs and excludes password hash, CPF, CNPJ, full address, screening answers, and internal fields in the test file from T020 (Owner: Pedro; depends on T024)
- [X] T026 [US2] Update `specs/003-backend-frontend-integration/integration-matrix.md` session row to `backend ready` with validation evidence (Owner: Pedro; depends on T025)
- [X] T027 [US2] Integrate real session consumption in `frontend/src/lib/data/sessao.ts` without touching `tasks.md` (Owner: Arthur; depends on T026)
- [X] T028 [US2] Remove localStorage-based session persistence for the auth flow from `frontend/src/lib/data/sessao.ts` after real login/session/logout works (Owner: Arthur; depends on T027)
- [X] T029 [US2] Validate protected-route redirect behavior in `frontend/src/routes/_authenticated.tsx` against the real session contract (Owner: Arthur; depends on T028)
- [X] T030 [US2] Update `specs/003-backend-frontend-integration/integration-matrix.md` session row to `flow complete` with backend and frontend validation evidence (Owner: Pedro; depends on T029)

**Checkpoint**: Authentication proof complete before profile, adopter journey, owner, admin, dashboard, health or chat integration begins.

## Phase 5: Route Corrections (User Story 5 - P3)

**Goal**: Make active `frontend/` routes render expected screens and prevent root UI from becoming a competing public interface.

**Independent Test**: Navigation through every public, auth, adopter, responsible, and admin route either renders the expected `frontend/` screen or is logged as a known defect.

- [ ] T031 [P] [US5] Audit route tree generation and route filenames in `frontend/src/routes/README.md`, `frontend/src/routeTree.gen.ts`, and `frontend/src/routes/` (Owner: Arthur)
- [ ] T032 [P] [US5] Audit root service-only status by confirming `app/` contains only backend API routes and recording result in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [ ] T033 [US5] Fix first documented URL-change/no-render bug in the specific `frontend/src/routes/*.tsx` file recorded by T005 (Owner: Arthur; depends on T005 and T031)
- [ ] T034 [US5] Update `specs/003-backend-frontend-integration/integration-matrix.md` with route-correction evidence and remaining route defects (Owner: Pedro; depends on T033)

## Phase 6: Public Showcase (User Story 3 - P2)

**Goal**: Replace public animal browsing mocks with real public DTOs without exposing private data.

**Independent Test**: Public vitrine, filters, metrics and animal detail load real data and exclude sensitive fields.

### Tests for User Story 3 Public Flow

- [X] T035 [US3] Add failing public DTO exposure test for vitrine and animal detail in `__tests__/queries/public-animal.test.ts` (Owner: Pedro)
- [X] T036 [US3] Add failing public showcase filter/metrics contract test using `lib/queries/animal-showcase.ts` and `lib/queries/public-metrics.ts` in `__tests__/queries/public-animal.test.ts` or a new query test recorded in the matrix (Owner: Pedro; depends on T035)

### Implementation for User Story 3 Public Flow

- [X] T037 [US3] Define exact public vitrine and animal detail HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` and mark the corresponding matrix rows `contract defined` only with contract evidence (Owner: Pedro; depends on T016)
- [X] T038 [US3] Implement backend public DTO selection through existing `lib/queries/animal-showcase.ts`, `lib/queries/public-animal.ts`, `lib/queries/public-metrics.ts`, `lib/schemas/showcase.ts`, and `lib/tags.ts` (Owner: Pedro; depends on T035-T037 and requires the public showcase matrix rows at `contract defined`)
- [X] T039 [US3] Update matrix public showcase rows to `backend ready` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T038)
- [X] T040 [US3] Integrate public vitrine real data in `frontend/src/lib/data/animais.ts` and `frontend/src/lib/data/catalogos.ts` without removing unrelated mocks (Owner: Arthur; depends on T039)
- [X] T041 [US3] Validate public routes `frontend/src/routes/index.tsx`, `frontend/src/routes/vitrine.tsx`, and `frontend/src/routes/animais.$animalId.tsx` consume public DTOs and render empty/filter states (Owner: Arthur; depends on T040)
- [X] T042 [US3] Remove public-showcase mock/localStorage dependency from `frontend/src/lib/data/animais.ts` and `frontend/src/lib/data/catalogos.ts` only for completed public read flows (Owner: Arthur; depends on T041)
- [X] T043 [US3] Update matrix public showcase rows to `flow complete` with backend and frontend evidence (Owner: Pedro; depends on T042)

## Phase 7: Profiles and Screening (User Story 2 - P1)

**Goal**: Integrate real registration, editable profiles and adopter screening after authentication proof.

**Independent Test**: Adopter, organization and foster profiles use real data; screening persists; CPF/CNPJ remain read-only.

### Tests for User Story 2 Profiles

- [X] T044 [US2] Add failing backend tests for profile DTO sensitive-field exclusions and immutable CPF/CNPJ behavior in `__tests__/actions/auth-guards.test.ts` or a new profile test recorded in the matrix (Owner: Pedro)
- [X] T045 [US2] Add failing backend tests for screening save and screening-required behavior in `__tests__/actions/solicitacoes.test.ts` and `__tests__/actions/auth-guards.test.ts` (Owner: Pedro; depends on T044)

### Implementation for User Story 2 Profiles

- [X] T046 [US2] Audit profile field gaps between `frontend/INTEGRATION.md`, `frontend/src/lib/domain/types.ts`, and `prisma/schema.prisma`; record the unproven Organização/Acolhedor profile-photo expectation as `lacuna/decisão pendente`, not `contract defined`, and require an explicit product decision plus homologation validation before any schema change without creating a migration or changing the original database (Owner: Pedro; depends on T030)
- [X] T047 [US2] Define registration, profile and screening HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` and mark only the corresponding evidence-backed matrix rows `contract defined`; leave the profile-photo row pending until the required decision exists (Owner: Pedro; depends on T046)
- [X] T048 [US2] Implement backend profile/screening contract behavior through existing `lib/actions/auth-register.ts`, `lib/actions/triagem.ts`, `lib/schemas/adotante.ts`, `lib/auth.ts`, and `lib/permissions.ts` or documented route handlers from T047 (Owner: Pedro; depends on T044-T047 and requires each implemented matrix row at `contract defined`)
- [X] T049 [US2] Update matrix profile/screening rows to `backend ready` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T048)
- [X] T050 [US2] Integrate real registration/profile/screening calls in `frontend/src/lib/data/usuarios.ts` and affected routes `frontend/src/routes/cadastro.*.tsx`, `frontend/src/routes/_authenticated.triagem.tsx`, `frontend/src/routes/_authenticated.meu-perfil.tsx`, and `frontend/src/routes/_authenticated.dashboard.perfil.tsx` (Owner: Arthur; depends on T049)
- [X] T051 [US2] Remove profile and screening mock/localStorage dependency from `frontend/src/lib/data/usuarios.ts` only for completed profile/screening flows (Owner: Arthur; depends on T050)
- [X] T052 [US2] Update matrix profile/screening rows to `flow complete` with validation evidence (Owner: Pedro; depends on T051)

## Phase 8: Adopter Journey (User Story 3 - P2)

**Goal**: Integrate real favorites, adopter requests and adopter dashboard.

**Independent Test**: Screened adopter can favorite, request adoption, see request status, and retain data after reload/logout.

### Tests for User Story 3 Adopter Flow

- [X] T053 [US3] Add failing backend tests for favorite authorization and persistence in `__tests__/actions/solicitacoes.test.ts` or a new favorites test recorded in the matrix (Owner: Pedro)
- [X] T054 [US3] Add failing backend tests for adopter request guards: screening required, duplicate active request and unavailable animal in `__tests__/actions/solicitacoes.test.ts` (Owner: Pedro; depends on T053)

### Implementation for User Story 3 Adopter Flow

- [X] T055 [US3] Define favorites, adopter requests and adopter dashboard HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` and mark the corresponding matrix rows `contract defined` only with contract evidence (Owner: Pedro; depends on T052)
- [X] T056 [US3] Implement backend adopter journey contracts using `lib/actions/favoritos.ts`, `lib/actions/solicitacoes.ts`, `lib/actions/request-guards.ts`, `lib/queries/favorites.ts`, `lib/queries/adopter-requests.ts`, `lib/queries/adotante-dashboard.ts`, `lib/schemas/favorito.ts`, and `lib/schemas/solicitacao.ts` or route handlers documented by T055 (Owner: Pedro; depends on T053-T055 and requires each implemented matrix row at `contract defined`)
- [X] T057 [US3] Update matrix adopter journey rows to `backend ready` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T056)
- [X] T058 [US3] Integrate real favorites and adopter requests in `frontend/src/lib/data/favoritos.ts`, `frontend/src/lib/data/solicitacoes.ts`, `frontend/src/routes/_authenticated.meus-favoritos.tsx`, `frontend/src/routes/_authenticated.minhas-solicitacoes.tsx`, and adopter dashboard route (Owner: Arthur; depends on T057)
- [X] T059 [US3] Remove adopter journey mock/localStorage dependency from `frontend/src/lib/data/favoritos.ts` and relevant functions in `frontend/src/lib/data/solicitacoes.ts` (Owner: Arthur; depends on T058)
- [X] T060 [US3] Update matrix adopter journey rows to `flow complete` with validation evidence (Owner: Pedro; depends on T059)

## Phase 9: Animal Management (User Story 3 - P2)

**Goal**: Integrate real responsible-user animal management, photos and relationships.

**Independent Test**: Organization/foster manages only own animals, photos and relationships with real persistence.

### Tests for User Story 3 Animal Management

- [X] T061 [US3] Add failing backend tests for animal ownership isolation and XOR responsible owner in `__tests__/actions/animais.test.ts` (Owner: Pedro)
- [X] T062 [US3] Add failing backend tests for photo primary/order behavior in `__tests__/actions/animais.test.ts` or `__tests__/actions/documento-upload.test.ts` as appropriate (Owner: Pedro; depends on T061)
- [X] T063 [P] [US3] Add failing backend tests for relationship self-link rejection and bidirectional link/unlink in `__tests__/actions/animal-relacionado.test.ts` (Owner: Pedro)

### Implementation for User Story 3 Animal Management

- [X] T064 [US3] Define owner animal CRUD, schema/validation, photo/upload, relationship, and search/filter HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark each corresponding matrix row `contract defined` only with evidence (Owner: Pedro; depends on T060)
- [X] T065 [US3] Implement only the animal input schemas and server-side validation required by T064 in `lib/schemas/animal.ts`, `lib/schemas/foto-animal.ts`, and `lib/schemas/animal-relacionado.ts`, with validation tests passing and no unproven model or migration (Owner: Pedro; depends on T061-T064 and requires the schema/validation matrix row at `contract defined`)
- [X] T066 [US3] Implement only owner-scoped animal CRUD from T064 in `lib/actions/animais.ts` and `lib/queries/owned-animals.ts`, proving ownership isolation and XOR responsible owner (Owner: Pedro; depends on T061, T064-T065 and requires the animal CRUD matrix row at `contract defined`)
- [X] T067 [US3] Implement only animal photo ordering, primary-photo behavior, and authorized upload from T064 in `lib/actions/fotos.ts`, `lib/upload-router.ts`, and `app/api/uploadthing/route.ts` (Owner: Pedro; depends on T062, T064-T065 and requires the photo/upload matrix row at `contract defined`)
- [X] T068 [US3] Implement only animal relationship link/unlink behavior from T064 in `lib/actions/animal-relacionado.ts`, proving self-link rejection and bidirectional behavior (Owner: Pedro; depends on T063-T065 and requires the relationship matrix row at `contract defined`)
- [X] T069 [US3] Implement only owner animal search and filters from T064 in `lib/actions/animal-search.ts` and `lib/queries/owned-animals.ts`, with documented filter results verified (Owner: Pedro; depends on T064-T066 and requires the search/filter matrix row at `contract defined`)
- [X] T070 [US3] Update animal management matrix rows to `backend ready` only where T065-T069 tests and acceptance evidence pass (Owner: Pedro; depends on T065-T069)
- [ ] T071 [US3] Integrate real owner animal management in `frontend/src/lib/data/animais.ts`, `frontend/src/routes/_authenticated.dashboard.animais.*.tsx`, `frontend/src/components/app/AnimalForm.tsx`, and `frontend/src/components/app/RelatedAnimalsPanel.tsx` (Owner: Arthur; depends on T070)
- [ ] T072 [US3] Remove owner animal management mock/localStorage dependency from completed functions in `frontend/src/lib/data/animais.ts` (Owner: Arthur; depends on T071)
- [ ] T073 [US3] Update matrix animal management rows to `flow complete` with validation evidence (Owner: Pedro; depends on T072)

## Phase 10: Health and Requests (User Story 3 - P2)

**Goal**: Integrate feature 001 health records and owner request decision flows.

**Independent Test**: Owner reviews own requests, decides adoption, manages health records, and cannot access another owner data.

### Tests for User Story 3 Health and Requests

- [ ] T074 [P] [US3] Add failing backend tests for owner-only request review and decision in `__tests__/queries/owner-requests.test.ts` and `__tests__/actions/solicitacoes.test.ts` (Owner: Pedro)
- [ ] T075 [P] [US3] Add failing backend tests for health date validation and no adopter/visitor health mutation in `__tests__/actions/registro-saude.test.ts` (Owner: Pedro)

### Implementation for User Story 3 Health and Requests

- [ ] T076 [US3] Define owner request-decision and feature 001 health-record HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark each corresponding matrix row `contract defined` only with evidence (Owner: Pedro; depends on T073)
- [ ] T077 [US3] Implement only responsible-party request listing, detail, and decision contracts from T076 in `lib/actions/solicitacoes.ts`, `lib/queries/owner-requests.ts`, `lib/queries/owner-request-detail.ts`, and `lib/schemas/solicitacao-decisao.ts`, proving ownership and transition rules (Owner: Pedro; depends on T074, T076 and requires the owner-request matrix rows at `contract defined`)
- [ ] T078 [US3] Implement only feature 001 health-record and procedure-alert contracts from T076 in `lib/actions/registro-saude.ts`, `lib/queries/procedure-alerts.ts`, and `lib/schemas/registro-saude.ts`, proving health authorization and date validation (Owner: Pedro; depends on T075-T076 and requires the health matrix rows at `contract defined`)
- [ ] T079 [US3] Update health/request matrix rows to `backend ready` only where T077-T078 tests and acceptance evidence pass (Owner: Pedro; depends on T077-T078)
- [ ] T080 [US3] Integrate real health and owner request flows in `frontend/src/lib/data/saude.ts`, `frontend/src/lib/data/solicitacoes.ts`, `frontend/src/routes/_authenticated.dashboard.solicitacoes.*.tsx`, `frontend/src/routes/_authenticated.dashboard.animais.$animalId.tsx`, `frontend/src/components/app/HealthPanel.tsx`, and `frontend/src/components/app/TriagemReadOnly.tsx` (Owner: Arthur; depends on T079)
- [ ] T081 [US3] Remove completed health/request mock/localStorage dependency from `frontend/src/lib/data/saude.ts` and relevant functions in `frontend/src/lib/data/solicitacoes.ts` (Owner: Arthur; depends on T080)
- [ ] T082 [US3] Update matrix health/request rows to `flow complete` with validation evidence (Owner: Pedro; depends on T081)

## Phase 11: Dashboard, Documents and Chat (User Story 4 - P2)

**Goal**: Audit feature 002 before integrating health center, dashboard, documents and chat.

**Independent Test**: Feature 002 areas are audited against spec/code before any row can move beyond `audited`; chat is available only after approval and read-only after completion.

### Tests for User Story 4

- [ ] T083 [US4] Audit feature 002 backend behavior against `specs/002-health-dashboard-chat/spec.md`, `lib/actions/cuidados-planejados.ts`, `lib/actions/documentos-saude.ts`, `lib/actions/mensagens.ts`, `lib/queries/health-dashboard.ts`, `lib/queries/operational-dashboard.ts`, and `lib/queries/mensagens.ts`; record pass/partial/blocked status in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [ ] T084 [P] [US4] Add failing backend tests for CONSULTA never becoming clinical history and planned-care idempotency in `__tests__/actions/cuidados-planejados.test.ts` and `__tests__/queries/health-dashboard.test.ts` (Owner: Pedro; depends on T083)
- [ ] T085 [P] [US4] Add failing backend tests for document privacy and dashboard ownership isolation in `__tests__/actions/documentos-saude.test.ts` and `__tests__/queries/operational-dashboard.test.ts` (Owner: Pedro; depends on T083)
- [ ] T086 [P] [US4] Add failing backend tests for chat only after approval, participant authorization, and archived read-only behavior in `__tests__/actions/mensagens.test.ts` and `__tests__/queries/mensagens.test.ts` (Owner: Pedro; depends on T083)

### Implementation for User Story 4

- [ ] T087 [US4] Define only the audited feature 002 health-center HTTP contract in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark its matrix row `contract defined` only with evidence and without presuming a missing endpoint or enum value (Owner: Pedro; depends on T083)
- [ ] T088 [US4] Define only the audited feature 002 operational-dashboard HTTP contract in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark its matrix row `contract defined` only with evidence and without presuming a missing endpoint or enum value (Owner: Pedro; depends on T087)
- [ ] T089 [US4] Define only the audited feature 002 health-document HTTP contract in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark its matrix row `contract defined` only with evidence and without presuming a missing endpoint or enum value (Owner: Pedro; depends on T088)
- [ ] T090 [US4] Define only the audited feature 002 chat HTTP contract in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md`; mark its matrix row `contract defined` only with evidence and without presuming a missing endpoint or enum value (Owner: Pedro; depends on T089)
- [ ] T091 [US4] Implement only the audited health-center contract from T087 in existing `lib/actions/cuidados-planejados.ts` and `lib/queries/health-dashboard.ts` or route handlers documented by T087, preserving the rule that CONSULTA never becomes clinical history (Owner: Pedro; depends on T084, T087 and requires the health-center matrix row at `contract defined`)
- [ ] T092 [US4] Implement only the audited operational-dashboard contract from T088 in existing `lib/queries/operational-dashboard.ts` or a route handler documented by T088, proving ownership isolation (Owner: Pedro; depends on T085, T088 and requires the dashboard matrix row at `contract defined`)
- [ ] T093 [US4] Implement only the audited health-document contract from T089 in existing `lib/actions/documentos-saude.ts`, related queries/schemas, or a route handler documented by T089, proving document privacy (Owner: Pedro; depends on T085, T089 and requires the health-document matrix row at `contract defined`)
- [ ] T094 [US4] Implement only the audited chat contract from T090 in existing `lib/actions/mensagens.ts`, `lib/queries/mensagens.ts`, and `app/api/mensagens/[id]/route.ts` or a route handler documented by T090, preserving access only after approval and read-only state after adoption conclusion (Owner: Pedro; depends on T086, T090 and requires the chat matrix row at `contract defined`)
- [ ] T095 [US4] Update feature 002 matrix rows to `backend ready` individually only where T091-T094 tests and acceptance evidence pass (Owner: Pedro; depends on T091-T094)
- [ ] T096 [US4] Audit missing frontend routes/components for health center, dashboard, documents, and chat in `frontend/src/routes/` and `frontend/src/components/app/`; record required Arthur Issue pairs and exact affected areas in `specs/003-backend-frontend-integration/integration-matrix.md` without creating Issues (Owner: Arthur; depends on T095)
- [ ] T097 [US4] Align health, dashboard, document, and chat types/enums in `frontend/src/lib/domain/` and affected `frontend/src/lib/data/` type boundaries to the contracts audited by T083 and defined by T087-T090; do not duplicate divergent types or presume enum values (Owner: Arthur; depends on T083, T087-T090, T096)
- [ ] T098 [US4] Integrate only the real health-center flow in the exact `frontend/src/routes/`, `frontend/src/components/app/`, and data files identified by T096, keeping CONSULTA out of clinical history (Owner: Arthur; depends on T095-T097)
- [ ] T099 [US4] Integrate only the real operational-dashboard flow in the exact `frontend/src/routes/`, `frontend/src/components/app/`, and data files identified by T096 (Owner: Arthur; depends on T095-T097)
- [ ] T100 [US4] Integrate only the real health-document flow in the exact `frontend/src/routes/`, `frontend/src/components/app/`, and data files identified by T096 (Owner: Arthur; depends on T095-T097)
- [ ] T101 [US4] Integrate only the real chat flow in the exact `frontend/src/routes/`, `frontend/src/components/app/`, and data files identified by T096, showing chat only after approval and disabling sends after adoption conclusion (Owner: Arthur; depends on T095-T097)
- [ ] T102 [US4] Remove only completed health-center mock/localStorage dependencies from the exact `frontend/src/lib/data/` modules identified by T096 after T098 works (Owner: Arthur; depends on T098)
- [ ] T103 [US4] Remove only completed dashboard mock/localStorage dependencies from the exact `frontend/src/lib/data/` modules identified by T096 after T099 works (Owner: Arthur; depends on T099)
- [ ] T104 [US4] Remove only completed health-document mock/localStorage dependencies from the exact `frontend/src/lib/data/` modules identified by T096 after T100 works (Owner: Arthur; depends on T100)
- [ ] T105 [US4] Remove only completed chat mock/localStorage dependencies from the exact `frontend/src/lib/data/` modules identified by T096 after T101 works (Owner: Arthur; depends on T101)
- [ ] T106 [US4] Update feature 002 matrix rows to `flow complete` individually with evidence for CONSULTA rule, dashboard ownership, document privacy, chat release, archived read-only state, frontend type alignment, and per-flow mock removal (Owner: Pedro; depends on T102-T105)

## Phase 12: Administration (User Story 3 - P2)

**Goal**: Integrate real admin user list and activation/deactivation.

**Independent Test**: Admin sees real users, toggles active status, and inactive users are blocked without exposing password hashes.

### Tests for User Story 3 Administration

- [ ] T107 [US3] Add failing backend tests for admin-only user list, active toggle, inactive block, and no password hash exposure in `__tests__/actions/admin-users.test.ts` (Owner: Pedro)

### Implementation for User Story 3 Administration

- [ ] T108 [US3] Define admin user HTTP contracts in `specs/003-backend-frontend-integration/contracts/http-contract-inventory.md` and mark the corresponding matrix rows `contract defined` only with contract evidence (Owner: Pedro; depends on T030)
- [ ] T109 [US3] Implement backend admin contracts using `lib/actions/admin-users.ts`, `lib/queries/admin-users.ts`, and `lib/schemas/admin-user.ts` or route handlers documented by T108 (Owner: Pedro; depends on T107-T108 and requires the admin matrix rows at `contract defined`)
- [ ] T110 [US3] Update matrix admin rows to `backend ready` in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T109)
- [ ] T111 [US3] Integrate real admin users in `frontend/src/lib/data/usuarios.ts` and `frontend/src/routes/_authenticated.dashboard.admin.usuarios.tsx` (Owner: Arthur; depends on T110)
- [ ] T112 [US3] Remove completed admin mock/localStorage dependency from admin functions in `frontend/src/lib/data/usuarios.ts` (Owner: Arthur; depends on T111)
- [ ] T113 [US3] Update matrix admin rows to `flow complete` with validation evidence (Owner: Pedro; depends on T112)

## Phase 13: Final Mock Removal (User Story 5 - P3)

**Goal**: Remove remaining mock/runtime localStorage dependency only after completed flows prove real persistence.

**Independent Test**: Clearing browser storage does not erase data for any flow marked `flow complete`.

- [ ] T114 [US5] Audit remaining runtime dependencies on `frontend/src/lib/data/db.ts` and `frontend/src/lib/data/seed.ts`; list each dependent flow in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur; depends on T043, T052, T060, T073, T082, T106, T113)
- [ ] T115 [US5] Remove or isolate `frontend/src/lib/data/db.ts` and `frontend/src/lib/data/seed.ts` as dev-only fixtures only after all dependent matrix rows are `flow complete` (Owner: Arthur; depends on T114)
- [ ] T116 [US5] Verify `frontend/` has no direct Prisma/PostgreSQL imports or DB credentials by scanning `frontend/src/` and record result in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T115)
- [ ] T117 [US5] Confirm no files under `legacy/frontend-antigo/` received feature 003 functionality and record result in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T115)

## Phase 14: End-to-End Homologation and Final Validation

**Purpose**: Validate integrated product in homologation without mutating the original database.

- [ ] T118 Create the homologation checklist in `specs/003-backend-frontend-integration/quickstart.md` with representative adopter, adopter without screening, organization, foster and admin accounts; define SC-006 timing steps for login/session reload/logout, public showcase filter-to-detail, profile edit, screening-to-request, responsible request decision, animal create-or-edit, health record operation, dashboard review, health-document access, approved/read-only chat, and admin activation/deactivation, recording role, timestamps, elapsed time, environment, result, and evidence reference (Owner: Pedro)
- [ ] T119 Run backend validation commands `npm test`, `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, and `npm run build`; record output summary in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro; depends on T118)
- [ ] T120 Run frontend validation commands `npm --prefix frontend run lint` and `npm --prefix frontend run build`; record output summary in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Arthur; depends on T118)
- [ ] T121 Validate no seed, reset, or migration was run against the original database during feature 003 and record confirmation in `specs/003-backend-frontend-integration/integration-matrix.md` (Owner: Pedro)
- [ ] T122 Execute the manual SC-006 checklist in homologation and record evidence that every selected small flow completed in under 3 minutes, without requiring an automated duration test (Owner: Pedro; depends on T043, T052, T060, T073, T082, T106, T113, T118)
- [ ] T123 Perform final matrix review and mark only completed feature 003 rows as `flow complete` in `specs/003-backend-frontend-integration/integration-matrix.md`; do not alter feature 001 T104 in `specs/001-animal-adoption-management/tasks.md` (Owner: Pedro; depends on T119-T122)

## Dependencies & Execution Order

### Phase Dependencies

- T001-T019 form the mandatory documentation gate: baseline audit, matrix, and HTTP contract inventory must all be completed and verified before any Phase 4-14 implementation task begins.
- Phase 1 blocks Phase 2.
- Phase 2 depends on Phase 1 and blocks contract definition.
- Phase 3 depends on Phase 2 and closes the initial documentation gate.
- Every later implementation task additionally requires its corresponding matrix row to be `contract defined`; a missing contract remains a gap or pending decision.
- Phase 4 authentication proof depends on T018 and T019 and blocks protected flows.
- Phase 5 route correction can start after Phase 1, but any affected flow cannot complete until route bugs for that flow are fixed.
- Phase 6 public showcase can start after Phase 3.
- Phases 7, 8, 9, 10, 11 and 12 depend on Phase 4 for authenticated contracts.
- Phase 11 depends on feature 002 audit T083 before any health-center/dashboard/document/chat integration.
- Phase 13 depends on all integrated flow rows that still use mocks.
- Phase 14 depends on desired flow completion and homologation readiness.

### Backend -> Frontend Dependencies

- Arthur tasks that replace mocks depend on Pedro tasks that mark the corresponding matrix row `backend ready`.
- Pedro updates to `flow complete` depend on Arthur validation and mock-removal tasks.
- Shared flows must use related Issues: backend contract/validation Issue first, frontend consumption Issue second.
- The matrix documents each Issue pair, owners, affected areas, order, dependencies, and acceptance criteria; no task in this document creates the Issues.

### Parallel Opportunities

- T023 can run in parallel with the sequential T020-T022 backend tests after T018/T019 because Arthur writes acceptance notes while Pedro writes backend tests.
- T031 and T032 can run in parallel because they have different owners and do not edit the same files.
- T063 can run in parallel with T061-T062 because it uses `__tests__/actions/animal-relacionado.test.ts`, not `__tests__/actions/animais.test.ts`.
- T074 and T075 can run in parallel because they target separate request and health test files.
- T084-T086 can run in parallel after T083 because they target separate feature 002 test areas.

## Parallel Examples

### Authentication Proof

```text
T020: backend session DTO test
T021: backend 401 without session test
T022: backend inactive user test
T023: frontend acceptance notes can run alongside the sequential backend-test chain
```

### Public Showcase

```text
T035: public DTO exposure test
T036: public filter/metrics contract test after T035 because both may edit public-animal.test.ts
```

### Feature 002 Audit

```text
T084: CONSULTA/planned-care tests
T085: documents/dashboard tests
T086: chat authorization/archive tests
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 audit.
2. Complete Phase 2 matrix.
3. Complete Phase 3 contract inventory.
4. Verify T001-T019 and close the mandatory documentation gate.
5. Complete Phase 4 authentication proof.
6. Stop and validate login, session after refresh, logout, 401 without session and inactive-user block.

### Incremental Delivery

1. Backend Issue documents and validates one contract group.
2. Frontend Issue consumes that contract and removes only that flow's mock/localStorage dependency.
3. Pedro updates matrix status and validation evidence.
4. Repeat by flow: public showcase, profiles/screening, adopter journey, animals, health/requests, feature 002, admin.

### Team Strategy

- Pedro/Codex owns `tasks.md`, backend, contracts, security and validation.
- Arthur/Claude owns `frontend/` implementation tasks and reports completion/evidence without editing `tasks.md`.
- No feature 003 work should modify `legacy/frontend-antigo/` except read-only audit evidence.

## Notes

- Every task has one responsible owner.
- [P] means same-phase work in different files with no dependency on incomplete tasks.
- A contract-definition task must update the corresponding matrix row to `contract defined` before implementation starts.
- Do not run seed, reset, or migrations against the original database.
- Database changes require a later homologation-backed task and are not implied by this tasks file.
- Do not mark or edit T104 in `specs/001-animal-adoption-management/tasks.md`.
