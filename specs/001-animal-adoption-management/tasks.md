---

description: "Task list for Animal Adoption Management implementation"
---

# Tasks: Animal Adoption Management

**Input**: Design documents from `/specs/001-animal-adoption-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests are not mandated by the feature spec. Manual acceptance validation is captured in the final phase using `specs/001-animal-adoption-management/quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- Every task includes exact file paths

## Path Conventions

- App Router pages: `app/`
- Domain UI: `components/app/`
- shadcn/ui: `components/ui/`
- Server Actions: `lib/actions/`
- Server queries: `lib/queries/`
- Zod schemas: `lib/schemas/`
- Prisma schema and seed: `prisma/`
- Auth/session types: `lib/auth.ts`, `types/next-auth.d.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize package/tooling configuration and establish the Prisma schema-first gate.

- [X] T001 Create `package.json` with Next.js 15, React, TypeScript, Prisma, NextAuth v5, Zod, Tailwind CSS v4, shadcn/ui prerequisites, Uploadthing, bcryptjs, ESLint scripts, and Prisma scripts
- [X] T002 Create `tsconfig.json` with `strict: true`, no implicit any, Next.js-compatible module settings, and path alias configuration
- [X] T003 Create `next.config.ts` with minimal Next.js configuration for App Router
- [X] T004 Create `postcss.config.mjs` for Tailwind CSS v4
- [X] T005 Create `eslint.config.mjs` with Next.js TypeScript linting and ignored generated/build paths
- [X] T006 Create complete Prisma schema with enums, models, relationships, and explicitly named indexes for `Animal.status`, `Animal.especieId`, `Animal.porte`, `Animal.sexo`, `RegistroSaude.animalId`, `RegistroSaude.tipo`, `SolicitacaoAdocao.adotanteId`, `SolicitacaoAdocao.animalId`, `Animal.organizacaoId`, and `Animal.acolhedorId` in `prisma/schema.prisma`
- [X] T007 Configure Prisma generator and datasource for PostgreSQL production and documented SQLite fallback in `prisma/schema.prisma`
- [X] T008 Run and verify Prisma schema validation, initial migration, and Prisma Client generation as a blocking gate before any application code starts using `prisma/schema.prisma`
- [X] T009 Create Prisma Client singleton in `lib/prisma.ts`
- [X] T010 Create seed data for catalogs, species, breeds, users, organizations, foster, adopters, animals, health records, related pairs, request, and favorites in `prisma/seed.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish application folders, auth, validation, permissions, and shared UI required by all stories.

**CRITICAL**: No user story work can begin until this phase is complete.
**SCHEMA-FIRST GATE**: T008 must pass before starting any task in this phase.

- [X] T011 Create `.env.example` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `UPLOADTHING_SECRET`, and `UPLOADTHING_APP_ID`
- [X] T012 Create App Router folders in `app/(auth)/`, `app/(public)/`, `app/dashboard/`, `app/api/auth/[...nextauth]/`, and `app/api/uploadthing/`
- [X] T013 Create domain folders in `components/app/animais/`, `components/app/auth/`, `components/app/dashboard/`, `components/app/saude/`, `components/app/solicitacoes/`, and `components/app/vitrine/`
- [X] T014 Create library folders in `lib/actions/`, `lib/queries/`, `lib/schemas/`, and `types/`
- [X] T015 Create `app/globals.css` with Tailwind CSS v4 import and base design tokens
- [X] T016 Create NextAuth configuration with Credentials provider, Prisma Adapter, bcryptjs password validation, role/session enrichment, and inactive-account blocking in `lib/auth.ts`
- [X] T017 Create NextAuth route handler in `app/api/auth/[...nextauth]/route.ts`
- [X] T018 Extend session and user types with `tipoPerfil`, `ativo`, and profile entity ids in `types/next-auth.d.ts`
- [X] T019 Create role, active-account, and ownership permission helpers in `lib/permissions.ts`
- [X] T020 Create shared auth guard helpers for Server Actions and dashboard reads in `lib/actions/auth-guards.ts`
- [X] T021 Create base Zod schemas for shared primitives, CPF, email, password, dates, IDs, pagination, and form state in `lib/schemas/common.ts`
- [X] T022 Create shared form state helpers for Server Actions in `lib/actions/form-state.ts`
- [X] T023 Create derived animal tag helper for Porte, Sexo, Castrado, Vacinado, Vermifugado, and Testado in `lib/tags.ts`
- [X] T024 Create root layout and metadata in `app/layout.tsx`
- [X] T025 Create basic public and dashboard layout shells in `app/(public)/layout.tsx` and `app/dashboard/layout.tsx`
- [X] T026 Create minimal shadcn/ui wrapper exports or placeholders for Button, Input, Select, Card, Table, Tabs, Dialog, Badge, Alert, and Form in `components/ui/`

**Checkpoint**: Schema, migration, generated Prisma Client, auth, validation primitives, and layouts are ready.

---

## Phase 3: User Story 1 - Buscar e conhecer animais disponiveis (Priority: P1)

**Goal**: Visitors can browse the public showcase, filter available animals, open animal profiles, view related animals, and get redirected for protected actions.

**Independent Test**: Open `/` without login, filter animals, open `/animais/[id]`, navigate related animals, and confirm protected actions redirect to login.

### Implementation for User Story 1

- [ ] T027 [P] [US1] Create showcase query with available-only filtering, tag filters, and 12-item pagination in `lib/queries/animal-showcase.ts`
- [ ] T028 [P] [US1] Create public animal detail query with public data minimization and related animals in `lib/queries/public-animal.ts`
- [ ] T029 [P] [US1] Create public metrics query for aggregate home values in `lib/queries/public-metrics.ts`
- [ ] T030 [P] [US1] Create showcase filter schema for search params in `lib/schemas/showcase.ts`
- [ ] T031 [US1] Create animal card component with primary photo, name, estimated age, responsible public data, and derived tags in `components/app/vitrine/animal-card.tsx`
- [ ] T032 [US1] Create showcase filter component with species, breed, size, sex, city, and tag controls in `components/app/vitrine/showcase-filters.tsx`
- [ ] T033 [US1] Create paginated showcase component with empty state and clear-filters action in `components/app/vitrine/showcase.tsx`
- [ ] T034 [US1] Create home page with metrics, CTA anchors, and integrated showcase in `app/(public)/page.tsx`
- [ ] T035 [US1] Create public animal gallery component in `components/app/animais/public-animal-gallery.tsx`
- [ ] T036 [US1] Create public animal health summary that hides empty sections in `components/app/animais/public-health-summary.tsx`
- [ ] T037 [US1] Create related animals component that hides when empty and omits request action for unavailable animals in `components/app/animais/related-animals.tsx`
- [ ] T038 [US1] Create public animal profile page in `app/(public)/animais/[id]/page.tsx`
- [ ] T039 [US1] Create login redirect helpers for request and favorite actions on public animal pages in `components/app/animais/protected-action-buttons.tsx`

**Checkpoint**: Public showcase and animal profile are usable without login and expose no sensitive data.

---

## Phase 4: User Story 2 - Cadastrar adotante e concluir triagem (Priority: P1)

**Goal**: Adopters can register, are redirected to standardized screening, can edit screening, and are blocked from adoption requests until screening is complete.

**Independent Test**: Register an adopter, verify redirect to `/dashboard/triagem`, submit screening, edit screening, and verify request guard behavior.

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create registration and adopter screening Zod schemas in `lib/schemas/adotante.ts`
- [ ] T041 [P] [US2] Create adopter registration Server Action with duplicate e-mail and CPF handling in `lib/actions/auth-register.ts`
- [ ] T042 [US2] Create login page with credentials form and callback handling in `app/(auth)/login/page.tsx`
- [ ] T043 [US2] Create shared registration profile selector page in `app/(auth)/cadastro/page.tsx`
- [ ] T044 [US2] Create adopter registration page using `registerAdopter` in `app/(auth)/cadastro/adotante/page.tsx`
- [ ] T045 [US2] Create adopter screening Server Action with standardized fields and `triagemConcluida` update in `lib/actions/triagem.ts`
- [ ] T046 [US2] Create adopter screening form component in `components/app/auth/triagem-form.tsx`
- [ ] T047 [US2] Create `/dashboard/triagem` page for viewing and editing screening in `app/dashboard/triagem/page.tsx`
- [ ] T048 [US2] Create adopter dashboard query with screening status in `lib/queries/adotante-dashboard.ts`
- [ ] T049 [US2] Add screening guard helper used by adoption request flow in `lib/actions/request-guards.ts`

**Checkpoint**: Adopter registration and standardized screening work independently.

---

## Phase 5: User Story 3 - Solicitar adocao e acompanhar status (Priority: P1)

**Goal**: Screened adopters can request adoption, favorite/unfavorite animals, and track requests and favorites.

**Independent Test**: Login as screened adopter, create one request, confirm duplicate rejection, favorite/unfavorite animals, and view dashboard lists.

### Implementation for User Story 3

- [ ] T050 [P] [US3] Create adoption request Zod schema in `lib/schemas/solicitacao.ts`
- [ ] T051 [P] [US3] Create favorite Zod schema in `lib/schemas/favorito.ts`
- [ ] T052 [US3] Implement `createAdoptionRequest` with session, active-account, adopter, screening, availability, and duplicate guards in `lib/actions/solicitacoes.ts`
- [ ] T053 [US3] Implement `toggleFavorite` with adopter-only guard in `lib/actions/favoritos.ts`
- [ ] T054 [US3] Wire request and favorite Server Actions into public animal buttons in `components/app/animais/protected-action-buttons.tsx`
- [ ] T055 [US3] Create adopter request list query in `lib/queries/adopter-requests.ts`
- [ ] T056 [US3] Create adopter favorites query in `lib/queries/favorites.ts`
- [ ] T057 [US3] Create adopter favorites page in `app/dashboard/favoritos/page.tsx`
- [ ] T058 [US3] Create adopter dashboard page with screening, requests, and favorites summary in `app/dashboard/page.tsx`

**Checkpoint**: Adoption request and favorites flows work for adopters.

---

## Phase 6: User Story 4 - Gerir animais e historico de saude (Priority: P2)

**Goal**: Organizations and fosters can create animals, manage status/photos/health records, link related animals, and view upcoming procedure alerts.

**Independent Test**: Login as organization or foster, create an animal with one primary photo, update status, create valid/invalid health records, link/unlink animals, and view upcoming alerts.

### Implementation for User Story 4

- [ ] T059 [P] [US4] Create animal Zod schema with XOR owner validation and primary-photo rules in `lib/schemas/animal.ts`
- [ ] T060 [P] [US4] Create photo Zod schema with max 10 photos and primary selection rules in `lib/schemas/foto-animal.ts`
- [ ] T061 [P] [US4] Create health record Zod schema with type-specific validation, date rules, and positive/negative-only test result in `lib/schemas/registro-saude.ts`
- [ ] T062 [P] [US4] Create animal relationship Zod schema with self-link prevention in `lib/schemas/animal-relacionado.ts`
- [ ] T063 [US4] Implement animal create, update, status update, and delete Server Actions with ownership guards in `lib/actions/animais.ts`
- [ ] T064 [US4] Implement Uploadthing route and ownership-aware upload configuration in `app/api/uploadthing/route.ts`
- [ ] T065 [US4] Implement photo ordering and primary-photo Server Actions in `lib/actions/fotos.ts`
- [ ] T066 [US4] Implement health record create, update, and delete Server Actions in `lib/actions/registro-saude.ts`
- [ ] T067 [US4] Implement bidirectional link and unlink Server Actions using Prisma transaction in `lib/actions/animal-relacionado.ts`
- [ ] T068 [US4] Create animal management query for own animals in `lib/queries/owned-animals.ts`
- [ ] T069 [US4] Create upcoming procedures query for next 30 days in `lib/queries/procedure-alerts.ts`
- [ ] T070 [US4] Create animal list and status controls in `components/app/animais/animal-management-list.tsx`
- [ ] T071 [US4] Create animal form component with photo primary selection in `components/app/animais/animal-form.tsx`
- [ ] T072 [US4] Create health record panel with vaccine, parasite, and disease-test categories in `components/app/saude/health-record-panel.tsx`
- [ ] T073 [US4] Create related animal management component with search and unlink controls in `components/app/animais/related-animal-manager.tsx`
- [ ] T074 [US4] Create animal management pages in `app/dashboard/animais/page.tsx`, `app/dashboard/animais/[id]/fotos/page.tsx`, `app/dashboard/animais/[id]/saude/page.tsx`, and `app/dashboard/animais/[id]/relacionados/page.tsx`
- [ ] T075 [US4] Add organization/foster dashboard metrics and procedure alerts to `app/dashboard/page.tsx`

**Checkpoint**: Animal, photo, health, relationship, and alert management work for owning responsible users.

---

## Phase 7: User Story 5 - Analisar e decidir solicitacoes de adocao (Priority: P2)

**Goal**: Organizations and fosters can list own adoption requests, view adopter screening, approve/refuse with observations, and isolate ownership.

**Independent Test**: Create requests for different owners, login as each owner, verify isolation, approve one request, and confirm competing requests are refused.

### Implementation for User Story 5

- [ ] T076 [P] [US5] Create request decision Zod schema with decision and observations in `lib/schemas/solicitacao-decisao.ts`
- [ ] T077 [US5] Extend request query for owner-scoped request lists sorted newest first in `lib/queries/owner-requests.ts`
- [ ] T078 [US5] Extend request query for owner-scoped request detail with read-only screening profile in `lib/queries/owner-request-detail.ts`
- [ ] T079 [US5] Implement `decideAdoptionRequest` approval/refusal transaction and competing-request refusal in `lib/actions/solicitacoes.ts`
- [ ] T080 [US5] Create requests list component with filtering controls in `components/app/solicitacoes/request-list.tsx`
- [ ] T081 [US5] Create read-only screening review component in `components/app/solicitacoes/screening-review.tsx`
- [ ] T082 [US5] Create request decision form component in `components/app/solicitacoes/request-decision-form.tsx`
- [ ] T083 [US5] Create owner requests page in `app/dashboard/solicitacoes/page.tsx`
- [ ] T084 [US5] Create owner request detail page in `app/dashboard/solicitacoes/[id]/page.tsx`

**Checkpoint**: Request analysis and decisions work with ownership isolation.

---

## Phase 8: User Story 6 - Consultar historico de adocoes e adotantes (Priority: P3)

**Goal**: Organizations and fosters can view completed adoptions for own animals and read adopter screening details.

**Independent Test**: Complete adoptions for different owners and confirm each owner sees only their own adoption history and read-only screening details.

### Implementation for User Story 6

- [ ] T085 [US6] Implement `completeAdoption` Server Action with owner guard and approved-request requirement in `lib/actions/solicitacoes.ts`
- [ ] T086 [P] [US6] Create completed adoptions query scoped to own animals in `lib/queries/completed-adoptions.ts`
- [ ] T087 [US6] Add complete-adoption action to request detail page in `app/dashboard/solicitacoes/[id]/page.tsx`
- [ ] T088 [US6] Create completed adoption list component in `components/app/solicitacoes/completed-adoption-list.tsx`
- [ ] T089 [US6] Create completed adopters history page in `app/dashboard/adotantes/page.tsx`

**Checkpoint**: Completed adoption history is visible only for own animals.

---

## Phase 9: User Story 7 - Administrar usuarios e acesso (Priority: P3)

**Goal**: Admins can list users, activate/deactivate accounts, and blocked users cannot access protected features.

**Independent Test**: Login as admin, deactivate a user, confirm blocked login/protected access message, reactivate user, and confirm permissions resume.

### Implementation for User Story 7

- [ ] T090 [P] [US7] Create admin user list query with user type and status in `lib/queries/admin-users.ts`
- [ ] T091 [P] [US7] Create admin user status Zod schema in `lib/schemas/admin-user.ts`
- [ ] T092 [US7] Implement `setUserActive` admin-only Server Action in `lib/actions/admin-users.ts`
- [ ] T093 [US7] Create user administration table component in `components/app/dashboard/admin-users-table.tsx`
- [ ] T094 [US7] Create admin users page in `app/dashboard/admin/usuarios/page.tsx`
- [ ] T095 [US7] Ensure inactive account message is enforced in auth/session guards in `lib/auth.ts` and `lib/actions/auth-guards.ts`

**Checkpoint**: Admin user management works and inactive users are blocked.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validate quality, security, seed data, responsive behavior, and acceptance criteria across all stories.

- [ ] T096 Verify Prisma schema formatting and validation with project commands documented in `specs/001-animal-adoption-management/quickstart.md`
- [ ] T097 Verify generated Prisma types are used without explicit `any` across `app/`, `components/`, `lib/`, `prisma/`, and `types/`
- [ ] T098 Verify all protected Server Actions call session and ownership guards before data access in `lib/actions/`
- [ ] T099 Verify public pages exclude CPF, CNPJ, phone, e-mail, full address, screening, and internal responsible data in `app/(public)/`
- [ ] T100 Verify derived tags are not persisted and are calculated through `lib/tags.ts`
- [ ] T101 Verify dashboard routes redirect unauthenticated users and forbid wrong roles in `app/dashboard/`
- [ ] T102 Verify responsive behavior at 375px for showcase, animal profile, forms, and dashboard pages in `components/app/`
- [ ] T103 Verify labels and accessible names exist for forms, filters, dialogs, and action buttons in `components/app/`
- [ ] T104 Execute manual acceptance checklist from `specs/001-animal-adoption-management/quickstart.md`
- [ ] T105 Update `README.md` with setup, environment, seed users, and quickstart commands
- [ ] T106 Run final TypeScript, lint, Prisma validation, and build checks using scripts in `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **US1, US2, US3 (P1)**: Depend on Foundational. US3 depends on US1 public animal actions and US2 adopter screening guards.
- **US4 (P2)**: Depends on Foundational; can run after schema/auth even before all P1 UI is complete, but public pages benefit from its data.
- **US5 (P2)**: Depends on US3 request creation and US4 ownership/animal management.
- **US6 (P3)**: Depends on US5 approval flow.
- **US7 (P3)**: Depends on Foundational auth/session setup.
- **Polish**: Depends on all desired stories.

### User Story Dependencies

- **US1**: Independent public browsing slice after Foundational.
- **US2**: Independent adopter onboarding slice after Foundational.
- **US3**: Requires US1 public animal profile actions and US2 triage guard.
- **US4**: Independent responsible-user management slice after Foundational.
- **US5**: Requires adoption requests from US3 and animal ownership from US4.
- **US6**: Requires request decisions from US5.
- **US7**: Independent admin slice after Foundational.

### Within Each User Story

- Zod schemas before Server Actions.
- Server Actions before UI wiring.
- Server queries before page components.
- Ownership/session checks before any protected read or write.
- Story checkpoint must pass before moving to dependent stories.

---

## Parallel Opportunities

- Setup tooling tasks T002-T005 can run in parallel after T001.
- No application-code task may start before T008 completes successfully.
- Foundational application tasks T014-T025 can run in parallel only after T008 migration and Prisma Client generation complete successfully.
- US1 query/schema tasks T027-T030 can run in parallel before UI tasks.
- US4 schemas T059-T062 can run in parallel before Server Actions.
- US7 query/schema tasks T091-T092 can run in parallel before admin UI.
- Polish verification tasks T097-T104 can run in parallel after implementation.

---

## Parallel Example: User Story 1

```bash
Task: "T027 [P] [US1] Create showcase query with available-only filtering, tag filters, and 12-item pagination in lib/queries/animal-showcase.ts"
Task: "T028 [P] [US1] Create public animal detail query with public data minimization and related animals in lib/queries/public-animal.ts"
Task: "T029 [P] [US1] Create public metrics query for aggregate home values in lib/queries/public-metrics.ts"
Task: "T030 [P] [US1] Create showcase filter schema for search params in lib/schemas/showcase.ts"
```

## Parallel Example: User Story 4

```bash
Task: "T059 [P] [US4] Create animal Zod schema with XOR owner validation and primary-photo rules in lib/schemas/animal.ts"
Task: "T060 [P] [US4] Create photo Zod schema with max 10 photos and primary selection rules in lib/schemas/foto-animal.ts"
Task: "T061 [P] [US4] Create health record Zod schema with type-specific validation, date rules, and positive/negative-only test result in lib/schemas/registro-saude.ts"
Task: "T062 [P] [US4] Create animal relationship Zod schema with self-link prevention in lib/schemas/animal-relacionado.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 for public discovery.
3. Complete US2 for adopter onboarding.
4. Complete US3 for request and favorite flow.
5. Validate public-to-adoption journey before P2 management expansion.

### Incremental Delivery

1. Public showcase and animal profile.
2. Adopter registration, screening, requests, and favorites.
3. Organization/foster animal and health management.
4. Request review and adoption decisions.
5. Completed adoption history.
6. Admin account controls.

### Validation Gates

- Prisma schema validates before application code depends on it.
- Every protected mutation has server-side Zod validation and session/ownership guard.
- Public pages expose only approved public responsible-party fields.
- Quickstart acceptance checklist passes before implementation is considered complete.

---

## Notes

- Tasks intentionally avoid repository/service abstractions; use direct Server Actions, Prisma Client, server queries, and components.
- Route Handlers are limited to NextAuth and Uploadthing integration.
- Tags are derived and must not become database columns.
- Raw SQL is not allowed.
- Explicit `any` is not allowed.
