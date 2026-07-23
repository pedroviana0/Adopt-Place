# Tasks: Health Operations Dashboard and Adoption Chat

**Input**: Design documents from `/specs/002-health-dashboard-chat/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Required test-first for critical paths by AdoptPlace Constitution IX and spec FR-079.

**Organization**: Tasks are ordered by dependency and grouped into the five requested phases. User story labels map to the incremental spec: [US1] Central de Saude, [US2] Painel Operacional, [US3] Chat da Adocao.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it edits different files and does not depend on incomplete tasks.
- **[Story]**: Present only for user-story phases.
- Every task names exact paths and a verifiable result.

---

## Fase 1: Migracao e Fundacoes Compartilhadas

**Purpose**: Create test-first shared foundations, additive Prisma evolution, validation schemas, minimal authorization/date helpers, seeds, and secure upload support required by every story.

- [X] T001 [P] Add failing schema tests for new health categories, CONSULTA exclusion from health history, planned-care dates, document type/size, dashboard filters, and message length in `__tests__/schemas/registro-saude.test.ts`, `__tests__/schemas/cuidado-planejado.test.ts`, `__tests__/schemas/documento-saude.test.ts`, `__tests__/schemas/dashboard-filters.test.ts`, and `__tests__/schemas/mensagem.test.ts`; Resultado: `npm test -- __tests__/schemas` fails only because schemas/enums are missing.
- [X] T002 [P] Add failing migration/model smoke tests for additive Prisma delegates and enum availability in `__tests__/schemas/prisma-models.test.ts`; Resultado: tests reference `cuidadoPlanejado`, `documentoSaude`, `conversaAdocao`, `conversaParticipante`, and `mensagemAdocao` and fail before schema update.
- [X] T003 Update `prisma/schema.prisma` with additive enum values `MEDICAMENTO_TRATAMENTO` and `PROCEDIMENTO`, new enums `TipoCuidadoPlanejado`, `StatusCuidadoPlanejado`, `TipoDocumentoSaude`, `StatusConversaAdocao`, and models `CuidadoPlanejado`, `DocumentoSaude`, `ConversaAdocao`, `ConversaParticipante`, `MensagemAdocao`; Resultado: `npx prisma validate` recognizes all new models and enum values.
- [X] T004 Confirm CONSULTA is absent from `TipoRegistroSaude` and present only in `TipoCuidadoPlanejado` in `prisma/schema.prisma` and `__tests__/schemas/prisma-models.test.ts`; Resultado: test asserts health-history enum excludes CONSULTA and planned-care enum includes CONSULTA.
- [X] T005 Create Prisma migration under `prisma/migrations/*_health_dashboard_chat/migration.sql` from the updated `prisma/schema.prisma`; Resultado: migration contains only additive changes plus indexes/unique constraints from `data-model.md`.
- [X] T006 Add planned-care backfill strategy for existing `RegistroSaude.dataProxima` rows in the new Prisma migration or documented one-time Prisma seed path under `prisma/migrations/*_health_dashboard_chat/migration.sql`; Resultado: each existing next date can produce one `CuidadoPlanejado` keyed by `origemRegistroSaudeId` without duplicating source records.
- [X] T007 Update `__tests__/setup.ts` Prisma mock with new delegates and transaction methods for `cuidadoPlanejado`, `documentoSaude`, `conversaAdocao`, `conversaParticipante`, and `mensagemAdocao`; Resultado: new action/query tests can mock all planned models without runtime undefined errors.
- [X] T008 Extend `lib/schemas/registro-saude.ts` with `MEDICAMENTO_TRATAMENTO` and `PROCEDIMENTO` variants while preserving existing vaccine, parasite, and disease-test validation messages; Resultado: existing `__tests__/schemas/animal.test.ts` and new health schema tests pass for old and new categories.
- [X] T009 [P] Create `lib/schemas/cuidado-planejado.ts` with consulta creation, reschedule, cancel, completion, and agenda filter validation; Resultado: `__tests__/schemas/cuidado-planejado.test.ts` passes for valid dates and rejects invalid transitions/input.
- [X] T010 [P] Create `lib/schemas/documento-saude.ts` with document type, MIME, file size, animal id, and optional health-record id validation; Resultado: `__tests__/schemas/documento-saude.test.ts` accepts PDF/image up to 10 MB and rejects invalid type/size.
- [X] T011 [P] Create `lib/schemas/dashboard-filters.ts` for serializable URL filters used by operational dashboard, requests, animal status, and health agenda; Resultado: `__tests__/schemas/dashboard-filters.test.ts` parses valid query strings and rejects unsupported filter values.
- [X] T012 [P] Create `lib/schemas/mensagem.ts` with trimmed text validation and 2,000-character limit; Resultado: `__tests__/schemas/mensagem.test.ts` rejects empty/whitespace/over-limit messages and accepts valid text.
- [X] T013 Add minimal ownership and participant helpers in `lib/permissions.ts` for `ownsPlannedCare`, `ownsHealthDocument`, and `canAccessConversation`; Resultado: helpers check `getServerSession()`-derived profile ownership or participant rows before protected data access in tests.
- [X] T014 [P] Create `lib/date-utils.ts` with application timezone constants and functions for today, overdue, next 7 days, and next 30 days grouping; Resultado: unit assertions in `__tests__/queries/health-dashboard.test.ts` can classify boundary dates deterministically.
- [X] T015 Extend `lib/upload-router.ts` with Uploadthing `healthDocument` route using image/PDF, 10 MB max, session/role/ownership middleware, and metadata creation payload; Resultado: route rejects unauthenticated/non-owner upload attempts before `DocumentoSaude` metadata creation.
- [X] T016 Update `prisma/seed.ts` deletion order to delete chat, planned-care, and document rows before existing dependent tables; Resultado: `npm run prisma:seed` can run repeatedly without foreign-key deletion failures after schema migration.
- [X] T017 Add seed fixtures in `prisma/seed.ts` for overdue care, today care, next-7-day care, next-30-day care, consulta, positive disease test, internal health document, active chat, and archived chat; Resultado: quickstart scenarios have deterministic demo data.
- [X] T018 Preserve feature 001 requirements and tests by running and documenting existing test compatibility for `__tests__/actions/solicitacoes.test.ts`, `__tests__/actions/animais.test.ts`, `__tests__/queries/public-animal.test.ts`, and `__tests__/schemas/animal.test.ts`; Resultado: old adoption, animal, and public-profile tests still pass or only fail for expected new mocks before implementation.

**Checkpoint**: Shared schema, validation, authorization, date helpers, upload foundations, and seed scaffolding are ready. User-story implementation may begin. By the approved intermediate-gate decision, typecheck may contain only the exhaustive-consumer errors resolved by T030 and T038; any additional type error blocks progress, and full green typecheck is mandatory after T038.

---

## Fase 2: Central de Saude (P1)

**Goal**: Deliver responsible-only health overview, agenda, per-animal history, documents, future-care generation, consultation agenda behavior, and atomic completion.

**Independent Test**: As ORGANIZACAO/ACOLHEDOR, manage only owned animals in `/dashboard/saude`, `/dashboard/saude/agenda`, `/dashboard/saude/documentos`, and `/dashboard/animais/[id]/saude`; verify no CONSULTA in history and no documents/public internals on public animal pages.

### Tests for User Story 1

- [X] T019 [P] [US1] Add failing query tests for health overview grouping, positive tests, no-history animals, and ownership isolation in `__tests__/queries/health-dashboard.test.ts`; Resultado: tests fail until `getHealthOverview` groups data by application timezone and owner.
- [X] T020 [P] [US1] Add failing agenda query tests for filters by animal/type/status/period and no duplicate next-date care in `__tests__/queries/health-agenda.test.ts`; Resultado: tests fail until one `CuidadoPlanejado` appears per `origemRegistroSaudeId`.
- [X] T021 [P] [US1] Add failing document query tests for owner-only listing and public exclusion in `__tests__/queries/documentos-saude.test.ts`; Resultado: tests fail until document queries filter by owned animals.
- [X] T022 [P] [US1] Add failing tests for health record create/update/delete ownership and new categories in `__tests__/actions/registro-saude.test.ts`; Resultado: tests fail until `RegistroSaude` actions support `MEDICAMENTO_TRATAMENTO` and `PROCEDIMENTO` without breaking existing categories.
- [X] T023 [P] [US1] Add failing critical-path tests for planned-care completion idempotency and atomic record creation in `__tests__/actions/cuidados-planejados.test.ts`; Resultado: double completion creates one record and returns an error for the second attempt after implementation.
- [X] T024 [P] [US1] Add failing critical-path tests proving CONSULTA completion never creates health history in `__tests__/actions/cuidados-planejados.test.ts`; Resultado: tests assert `registroSaude.create` is not called for CONSULTA.
- [X] T025 [P] [US1] Add failing document upload/delete authorization tests in `__tests__/actions/documentos-saude.test.ts`; Resultado: non-owner deletion is denied and invalid metadata is rejected.
- [X] T026 [P] [US1] Extend public animal privacy tests in `__tests__/queries/public-animal.test.ts`; Resultado: public query output never includes `DocumentoSaude`, `CuidadoPlanejado`, `observacoes`, or `profissionalClinica`.

### Implementation for User Story 1

- [X] T027 [US1] Implement `getHealthOverview`, `getHealthAgenda`, and date-derived status mapping in `lib/queries/health-dashboard.ts`; Resultado: T019 and T020 pass for grouping, filters, and owner isolation.
- [X] T028 [US1] Implement `getAnimalHealthTimeline` in `lib/queries/health-dashboard.ts` selecting completed health facts only and excluding CONSULTA by model design; Resultado: timeline query returns `VACINA`, `CONTROLE_PARASITAS`, `TESTE_DOENCA`, `MEDICAMENTO_TRATAMENTO`, and `PROCEDIMENTO` only.
- [X] T029 [US1] Implement `getHealthDocuments` and `getHealthDocumentDetail` in `lib/queries/documentos-saude.ts`; Resultado: T021 passes and document metadata includes animal, optional record, type, file name, MIME, size, and internal open href.
- [X] T030 [US1] Update `lib/actions/registro-saude.ts` to map new health categories, store internal notes/professional fields, and preserve existing vaccine/parasite/test behavior; Resultado: T022 and existing health tests pass.
- [X] T031 [US1] Add upsert/remove of linked `CuidadoPlanejado` from `RegistroSaude.dataProxima` in `lib/actions/registro-saude.ts`; Resultado: creating/updating/removing next date changes exactly one pending planned-care row.
- [X] T032 [US1] Create `lib/actions/cuidados-planejados.ts` with `createConsultaPlanejada`, `rescheduleCuidadoPlanejado`, and `cancelCuidadoPlanejado`; Resultado: agenda actions authorize owner and mutate one row per planned event.
- [X] T033 [US1] Implement `completeCuidadoPlanejado` transaction in `lib/actions/cuidados-planejados.ts` using conditional pending-row claim and `RegistroSaude` creation for non-CONSULTA; Resultado: T023 passes and pending care closes atomically.
- [X] T034 [US1] Implement CONSULTA completion branch in `lib/actions/cuidados-planejados.ts` without `registroSaude.create`; Resultado: T024 passes and CONSULTA is only marked `CONCLUIDO`.
- [X] T035 [US1] Create `lib/actions/documentos-saude.ts` with `deleteDocumentoSaude` that authorizes owner, deletes metadata, and attempts provider file deletion when key exists; Resultado: T025 passes and metadata is removed without touching health records.
- [X] T036 [US1] Update `lib/upload-router.ts` `healthDocument.onUploadComplete` to create `DocumentoSaude` metadata only after ownership and metadata validation; Resultado: valid PDF/image upload creates an internal document row for owned animal.
- [X] T037 [US1] Update `lib/queries/public-animal.ts` to select only public-safe health fields after new `RegistroSaude` fields are added; Resultado: T026 passes and public profile data shape excludes internal fields/documents/agenda.
- [X] T038 [US1] Update `components/app/animais/public-health-summary.tsx` to handle new health enum values safely and never render internal notes/professional/document data; Resultado: public health summary renders allowed facts without leaking internal details.
- [X] T039 [P] [US1] Create `components/app/saude/health-overview.tsx` for overview groups, no-history animals, and positive-test sections; Resultado: component renders supplied `HealthOverview` without client aggregation.
- [X] T040 [P] [US1] Create `components/app/saude/health-agenda-list.tsx` for agenda filters/actions, client-facing Zod validation feedback, and confirmation states; Resultado: component accepts URL-derived filters, validates form input before submit for UX, and exposes open animal, complete, reschedule, and cancel controls.
- [X] T041 [P] [US1] Create `components/app/saude/health-document-list.tsx` for document metadata, open/download, upload validation feedback, and delete confirmation; Resultado: component renders internal documents, shows client-facing type/size validation before upload, and delete action states.
- [X] T042 [P] [US1] Create `components/app/saude/health-history-timeline.tsx` for per-animal completed facts; Resultado: timeline has no CONSULTA rendering branch and displays allowed categories only.
- [X] T043 [US1] Create health overview page in `app/dashboard/saude/page.tsx`; Resultado: responsible users see overview, ADOTANTE/visitor access is denied by `requireResponsible`.
- [X] T044 [US1] Create agenda page in `app/dashboard/saude/agenda/page.tsx`; Resultado: URL filters call server query and render filtered chronological agenda.
- [X] T045 [US1] Create documents page in `app/dashboard/saude/documentos/page.tsx`; Resultado: responsible users can list/upload/open/delete internal documents for owned animals only.
- [X] T046 [US1] Update per-animal health page in `app/dashboard/animais/[id]/saude/page.tsx` to use timeline, agenda, and document sections; Resultado: owned animal page shows completed history and internal operational controls.
- [X] T047 [US1] Update `components/app/saude/health-record-panel.tsx` to submit extended health categories through server actions with minimal client state and client-facing Zod validation feedback; Resultado: users see immediate validation errors, can create all allowed history categories, and existing categories still work.
- [X] T048 [US1] Run focused health tests for `__tests__/actions/registro-saude.test.ts`, `__tests__/actions/cuidados-planejados.test.ts`, `__tests__/actions/documentos-saude.test.ts`, `__tests__/queries/health-dashboard.test.ts`, and `__tests__/queries/documentos-saude.test.ts`; Resultado: Central de Saude test suite passes.

**Checkpoint**: Central de Saude is functional and independently testable.

---

## Fase 3: Painel Operacional (P2, depende da Fase 2)

**Goal**: Replace the responsible dashboard with server-side, owner-isolated operational metrics, clickable indicators, prioritized pending items, adoption funnel, animal status summary, recent activity, quick actions, and resilient UI states.

**Independent Test**: As ORGANIZACAO/ACOLHEDOR, open `/dashboard`, click every indicator, verify URL filters and metrics update after health/adoption changes; as another responsible user, verify no cross-owner data appears.

### Tests for User Story 2

- [X] T049 [P] [US2] Add failing aggregate query tests for owner-isolated indicators, priority ordering, funnel, status counts, and recent activity in `__tests__/queries/operational-dashboard.test.ts`; Resultado: tests fail until dashboard data is computed in `getOperationalDashboard`.
- [X] T050 [P] [US2] Add failing request URL-filter tests for `status=EM_ANALISE` in `__tests__/queries/owner-requests.test.ts`; Resultado: tests fail until owner requests query accepts server-side filters.
- [X] T051 [P] [US2] Add failing dashboard update tests after animal creation, request approval, adoption completion, and health registration in `__tests__/queries/operational-dashboard.test.ts`; Resultado: tests verify metrics derive from current source-of-truth mocks.
- [X] T052 [P] [US2] Add failing dashboard isolation regression tests in `__tests__/queries/operational-dashboard.test.ts`; Resultado: metrics never aggregate another responsible party's animals, care, or requests.

### Implementation for User Story 2

- [X] T053 [US2] Create `getOperationalDashboard` in `lib/queries/operational-dashboard.ts` using Prisma counts/grouping and bounded selects by responsible ownership; Resultado: T049, T051, and T052 pass without client aggregation.
- [X] T054 [US2] Update `lib/queries/owner-requests.ts` to accept parsed URL filters from `lib/schemas/dashboard-filters.ts`; Resultado: T050 passes and `status=EM_ANALISE` is applied server-side.
- [X] T055 [US2] Update `lib/queries/owned-animals.ts` to accept optional status filters for dashboard indicator links; Resultado: `/dashboard/animais?status=DISPONIVEL` and other canonical status filters return owned animals only.
- [X] T056 [P] [US2] Create `components/app/dashboard/operational-dashboard.tsx` for indicators, priority items, funnel, status counts, activity, quick actions, and unread count display; Resultado: component renders `OperationalDashboard` contract without calculating metrics.
- [X] T057 [P] [US2] Create `components/app/dashboard/dashboard-empty-state.tsx` for responsible users with no animals/requests/care; Resultado: empty state provides first-step actions to register animal and open health agenda.
- [X] T058 [P] [US2] Create `components/app/dashboard/dashboard-error-state.tsx` for recoverable dashboard failures; Resultado: UI has a clear error message and retry/navigation action.
- [X] T059 [US2] Update responsible branch of `app/dashboard/page.tsx` to call `getOperationalDashboard` and render `OperationalDashboard`; Resultado: `/dashboard` answers "o que precisa da minha atencao agora?" with clickable metrics.
- [X] T060 [US2] Preserve adopter/admin dashboard branches in `app/dashboard/page.tsx` while adding only unread message indicators required by this feature; Resultado: ADOTANTE and ADMIN flows still render existing content.
- [X] T061 [US2] Update `app/dashboard/solicitacoes/page.tsx` to parse `searchParams.status` and pass filters into `getOwnerRequests`; Resultado: dashboard indicator opens `/dashboard/solicitacoes?status=EM_ANALISE` filtered on first render.
- [X] T062 [US2] Update `components/app/solicitacoes/request-list.tsx` to use URL-backed filters instead of client-only filtering; Resultado: status filter changes are serializable and shareable by URL.
- [X] T063 [US2] Update `app/dashboard/animais/page.tsx` and `components/app/animais/animal-management-list.tsx` to honor optional status filters from dashboard links; Resultado: animal indicator links open already-filtered owned animal lists.
- [X] T064 [US2] Add responsive layout checks in `components/app/dashboard/operational-dashboard.tsx` using existing CSS utilities for 375 px width; Resultado: indicators, priority items, quick actions, and unread badge remain readable/actionable.
- [X] T065 [US2] Run focused dashboard tests for `__tests__/queries/operational-dashboard.test.ts`, `__tests__/queries/owner-requests.test.ts`, and existing dashboard-related tests; Resultado: Painel Operacional query and filter tests pass.

**Checkpoint**: Painel Operacional is functional after Central de Saude and independently testable for responsible users.

---

## Fase 4: Chat da Adocao (P2)

**Goal**: Release exactly one private conversation after approval, archive on adoption completion, list/read/send messages with unread counters, support simple polling, and expose interfaces to adopter and responsible users.

**Independent Test**: Approve a request, verify both authorized participants see one active conversation, exchange text, unread counters update, third parties are denied, and completion archives the conversation read-only.

### Tests for User Story 3

- [X] T066 [P] [US3] Extend approval transaction tests in `__tests__/actions/solicitacoes.test.ts` for exactly one `ConversaAdocao` creation and participant rows while preserving competing-request refusal; Resultado: tests fail until chat creation is integrated without breaking existing approval assertions.
- [X] T067 [P] [US3] Extend adoption completion tests in `__tests__/actions/solicitacoes.test.ts` for conversation archiving; Resultado: tests fail until `completeAdoption` updates chat to `ARQUIVADA` in the transaction.
- [X] T068 [P] [US3] Add failing chat authorization and list/detail query tests in `__tests__/queries/mensagens.test.ts`; Resultado: only participant conversations are returned and ADMIN/non-participants are denied.
- [X] T069 [P] [US3] Add failing send-message validation tests in `__tests__/actions/mensagens.test.ts`; Resultado: empty, over-limit, unauthorized, nonexistent, and archived sends are rejected.
- [X] T070 [P] [US3] Add failing read/unread counter tests in `__tests__/actions/mensagens.test.ts` and `__tests__/queries/mensagens.test.ts`; Resultado: opening a conversation updates participant read marker and unread count becomes coherent.
- [X] T071 [P] [US3] Add failing polling route tests in `__tests__/queries/mensagens-polling.test.ts`; Resultado: participant-only polling returns plain message data after a cursor and denies unauthorized users.
- [X] T072 [P] [US3] Add failing concurrency/idempotency test for duplicate approval attempts in `__tests__/actions/solicitacoes.test.ts`; Resultado: `@@unique(solicitacaoId)`/upsert prevents duplicate conversations.

### Implementation for User Story 3

- [X] T073 [US3] Update `lib/actions/solicitacoes.ts` approval transaction to upsert `ConversaAdocao` and create two `ConversaParticipante` rows for adopter user and responsible user; Resultado: T066 and T072 pass while existing competing-request refusal test still passes.
- [X] T074 [US3] Update `lib/actions/solicitacoes.ts` completion transaction to archive the related conversation when request becomes `CONCLUIDA`; Resultado: T067 passes and chat becomes read-only after adoption completion.
- [X] T075 [US3] Create `lib/queries/mensagens.ts` with conversation list, conversation detail, unread count, and participant authorization queries; Resultado: T068 and T070 query assertions pass.
- [X] T076 [US3] Create `lib/actions/mensagens.ts` with `sendMensagem` and `markConversationRead`; Resultado: T069 and T070 action assertions pass.
- [X] T077 [US3] Create polling Route Handler in `app/api/mensagens/[id]/route.ts`; Resultado: T071 passes with authorized participant-only polling and no WebSocket.
- [X] T078 [P] [US3] Create `components/app/mensagens/conversation-list.tsx` for active/archived filters, animal, counterparty, last message, timestamp, status, and unread count; Resultado: list renders `ConversationListItem` contract.
- [X] T079 [P] [US3] Create `components/app/mensagens/conversation-detail.tsx` for chronological history, plain-text message rendering, client-facing message validation feedback, read-only archived state, and send form; Resultado: message text is rendered as text nodes, empty/over-limit messages show immediate UX errors, and send form is hidden/disabled when archived.
- [X] T080 [US3] Create `app/dashboard/mensagens/page.tsx` to list participant conversations for ADOTANTE, ORGANIZACAO, and ACOLHEDOR; Resultado: authorized users see only their conversations and filters work.
- [X] T081 [US3] Create `app/dashboard/mensagens/[id]/page.tsx` to show conversation detail and mark visible received messages as read; Resultado: opening detail updates read state and blocks third-party access.
- [X] T082 [US3] Update `app/dashboard/solicitacoes/[id]/page.tsx` to show `Abrir conversa` for approved authorized requests and link to archived history after completion; Resultado: approved request detail exposes chat entry without enabling chat for EM_ANALISE/RECUSADA.
- [X] T083 [US3] Update `app/dashboard/layout.tsx` with Mensagens navigation and global unread count from `lib/queries/mensagens.ts`; Resultado: navigation shows unread indicator for ADOTANTE/responsible participants only.
- [X] T084 [US3] Ensure `components/app/mensagens/conversation-detail.tsx` and any polling client state use simple interval refresh only, with no WebSocket or new dependency; Resultado: dependency diff shows no WebSocket package and polling remains scoped to chat display.
- [X] T085 [US3] Run focused chat tests for `__tests__/actions/solicitacoes.test.ts`, `__tests__/actions/mensagens.test.ts`, `__tests__/queries/mensagens.test.ts`, and polling tests; Resultado: Chat da Adocao test suite passes.

**Checkpoint**: Chat da Adocao is functional and independently testable for approved/completed requests.

---

## Fase 5: Contrato, Qualidade e Validacao Integrada

**Purpose**: Keep Lovable integration documents current, validate demo data, run full test/quality gates, and confirm every spec scenario is covered.

- [X] T086 [P] Update `specs/002-health-dashboard-chat/contracts/frontend-integration.md` after implementation with final data shapes, operation names, URL filters, errors, and authorization behavior; Resultado: Lovable contract matches implemented exports and routes.
- [X] T087 [P] Update `specs/002-health-dashboard-chat/contracts/server-actions.md` after implementation with final action signatures and return shapes; Resultado: action contract matches `lib/actions/registro-saude.ts`, `lib/actions/cuidados-planejados.ts`, `lib/actions/documentos-saude.ts`, `lib/actions/solicitacoes.ts`, and `lib/actions/mensagens.ts`.
- [X] T088 [P] Update `specs/002-health-dashboard-chat/contracts/routes.md` after implementation with final route/filter behavior; Resultado: route contract matches pages and the polling endpoint.
- [X] T089 Update `specs/002-health-dashboard-chat/quickstart.md` with any final seed credentials, URLs, and manual validation notes discovered during implementation; Resultado: a fresh developer can run the documented validation end-to-end.
- [X] T090 Validate demonstration data in `prisma/seed.ts` by running seed after migration and manually checking overdue, today, future, consulta, positive test, documents, active chat, and archived chat records; Resultado: quickstart fixtures exist and are visible to the correct owner only.
- [X] T091 Add integrated flow tests in `__tests__/actions/health-chat-dashboard-flow.test.ts` covering health completion updating dashboard and request approval/conclusion updating chat/dashboard state; Resultado: cross-feature behavior passes without duplicating unit tests.
- [X] T092 Run `npm run prisma:validate`; Resultado: Prisma schema validates with no raw SQL/manual schema drift.
- [X] T093 Run `npm run typecheck`; Resultado: TypeScript strict passes with no explicit `any` introduced by feature code.
- [X] T094 Run `npm run lint`; Resultado: ESLint passes for updated app, lib, component, Prisma-adjacent, and test files.
- [X] T095 Run `npm test`; Resultado: all existing feature 001 tests and new feature 002 tests pass.
- [X] T096 Run `npm run build`; Resultado: Next.js production build succeeds with new dashboard, health, documents, and message routes.
- [X] T097 Review `app/(public)/animais/[id]/page.tsx`, `lib/queries/public-animal.ts`, and `components/app/animais/public-health-summary.tsx` for public privacy; Resultado: documents, internal notes, professional/clinic, agenda, and chat are absent from public output.
- [X] T098 Review completed task coverage against `specs/002-health-dashboard-chat/spec.md` acceptance scenarios and update this file only with implementation notes if a scenario is not covered; Resultado: every minimum scenario has at least one task/test/manual validation path.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1**: No feature dependency; must complete before Fase 2, Fase 3, or Fase 4 implementation because it creates schema, validation, mocks, upload foundation, dates, permissions, and seed scaffolding.
- **Fase 2 (US1)**: Depends on Fase 1. It is the MVP and blocks Fase 3 because the operational dashboard consumes health agenda/overview data.
- **Fase 3 (US2)**: Depends on Fase 2 for health metrics and agenda links.
- **Fase 4 (US3)**: Depends on Fase 1 and existing adoption request actions; can start after Fase 1, but integration with dashboard unread counts is cleaner after Fase 3 components exist. Polling route work is required by T071/T077 and remains scoped to chat reads.
- **Fase 5**: Depends on selected implementation phases being complete.

### User Story Dependencies

- **US1 Central de Saude (P1)**: MVP after Fase 1; no dependency on dashboard or chat.
- **US2 Painel Operacional (P2)**: Depends on US1 because dashboard metrics include overdue/today/next-7 health care.
- **US3 Chat da Adocao (P2)**: Depends on Fase 1 schema and existing adoption flow; independent from US1 for core chat, but dashboard unread indicator integrates with US2.

### Test-First Critical Paths

- Ownership isolation: T019, T021, T049, T052, T068 before implementation.
- Planned-care completion idempotency/atomicity: T023 before T033.
- CONSULTA outside health history: T004, T024 before T034 and T042.
- Approval creates one conversation and preserves competing refusal: T066, T072 before T073.
- Adoption completion archives chat: T067 before T074.
- Chat send/read validation: T069, T070 before T076.

### Parallel Opportunities

- Fase 1 test/schema files marked [P] can run in parallel before schema implementation.
- Fase 2 query/action test files T019-T026 can run in parallel after Fase 1 mocks exist.
- Fase 2 UI components T039-T042 can run in parallel after query/action contracts stabilize.
- Fase 3 component tasks T056-T058 can run in parallel after `OperationalDashboard` data shape is stable.
- Fase 4 tests T066-T072 can run in parallel after Fase 1 mocks exist; components T078-T079 can run in parallel after query/action contracts stabilize.
- Fase 5 contract updates T086-T088 can run in parallel after implementation settles.

---

## Parallel Examples

### Fase 2 / US1

```text
Task: T019 Add health overview query tests in __tests__/queries/health-dashboard.test.ts
Task: T020 Add agenda query tests in __tests__/queries/health-agenda.test.ts
Task: T021 Add document query tests in __tests__/queries/documentos-saude.test.ts
Task: T022 Add health action tests in __tests__/actions/registro-saude.test.ts
```

### Fase 3 / US2

```text
Task: T056 Create components/app/dashboard/operational-dashboard.tsx
Task: T057 Create components/app/dashboard/dashboard-empty-state.tsx
Task: T058 Create components/app/dashboard/dashboard-error-state.tsx
```

### Fase 4 / US3

```text
Task: T068 Add message query authorization tests in __tests__/queries/mensagens.test.ts
Task: T069 Add send-message tests in __tests__/actions/mensagens.test.ts
Task: T078 Create components/app/mensagens/conversation-list.tsx
Task: T079 Create components/app/mensagens/conversation-detail.tsx
```

---

## Implementation Strategy

### MVP First: Central de Saude

1. Complete Fase 1.
2. Complete Fase 2 tests first and confirm they fail for missing implementation.
3. Implement Fase 2 backend and pages/components.
4. Run focused health tests and manual quickstart health/document privacy checks.

### Incremental Delivery

1. Fase 1 -> schema and shared foundations.
2. Fase 2 -> Central de Saude MVP.
3. Fase 3 -> Painel Operacional using real health/adoption data.
4. Fase 4 -> Chat da Adocao.
5. Fase 5 -> contracts, full gates, integrated validation.

### Guardrails

- Do not implement routing corrections or Meu Perfil work.
- Do not add WebSocket, queue, cron, external notifications, inventory, finance, or generic audit log.
- Do not add abstractions until two concrete current uses require them.
- Do not expose health documents, agenda, internal notes, professional/clinic fields, or chat data publicly.
- Preserve feature 001 tests and existing adoption request behavior, especially automatic refusal of competing in-analysis requests on approval.
