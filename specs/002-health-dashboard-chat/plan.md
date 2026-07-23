# Implementation Plan: Health Operations Dashboard and Adoption Chat

**Branch**: `002-health-dashboard-chat` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-health-dashboard-chat/spec.md`

## Summary

Add three integrated operational capabilities on top of feature 001 without replacing existing adoption or health behavior: a responsible-only health operations center, a source-of-truth operational dashboard, and adoption chat released only after request approval.

The technical approach is schema-first and additive. Existing `RegistroSaude` rows for `VACINA`, `CONTROLE_PARASITAS`, and `TESTE_DOENCA` remain valid. New health history categories are added to the same source-of-truth model, planned care is represented by a dedicated `CuidadoPlanejado` model to guarantee one pending future occurrence per next date, health documents use a new internal metadata model plus the existing Uploadthing integration, and chat uses one `ConversaAdocao` per approved request with immutable text messages and per-participant read state.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 15 App Router

**Primary Dependencies**: NextAuth v5, Prisma 5.x, Zod 3.x, Tailwind CSS v4, shadcn/ui, Uploadthing, lucide-react. No new runtime dependency is planned.

**Storage**: PostgreSQL 16 via Prisma schema and Prisma Client. Current schema has only `RegistroSaude` for `VACINA`, `CONTROLE_PARASITAS`, `TESTE_DOENCA`; this feature adds models and enum values through Prisma migration only.

**Testing**: Vitest (`npm test`) with existing `__tests__/setup.ts` Prisma/Auth mocks expanded for new models. Gates also include `npm run typecheck`, `npm run lint`, `npm run prisma:validate`, and `npm run build`. After Phase 1, typecheck may report only the two known exhaustive-consumer errors assigned to T030 (`lib/actions/registro-saude.ts`) and T038 (`components/app/animais/public-health-summary.tsx`); no other type error is accepted, and full green typecheck becomes mandatory again immediately after T038.

**Target Platform**: Next.js web application.

**Project Type**: Single web application repository with App Router pages, Server Actions, and Route Handlers limited to auth, upload, and the required chat polling read.

**Performance Goals**: Dashboard and health overview render from server aggregates without client-side aggregation; agenda and chat lists avoid N+1 by selecting all required display data in the server query. Chat history initially returns the latest 50 messages and paginates older history when needed.

**Constraints**: Preserve feature 001 contracts, automatic refusal of competing adoption requests, public health privacy, responsible-party isolation, no WebSocket, no cron, no queues, no external notifications, no generic audit log, no inventory/finance, no routing or Meu Perfil work.

**Scale/Scope**: MVP supports operational use for organizations/fosters with 100+ animals, routine health agenda/documents, and one private conversation per approved adoption request.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero over-engineering**: PASS. The plan adds only concrete feature modules: health operations, operational dashboard, health documents, and adoption chat. No repository/service framework is introduced; shared helpers are limited to repeated ownership/participant checks already required by multiple protected paths.
- **Schema first**: PASS. Data changes start in `prisma/schema.prisma` with additive enum values/models and a Prisma migration. Existing records remain valid and are backfilled into planned care only when `dataProxima` exists.
- **Server-side by default**: PASS. Mutations live in `lib/actions/`; server-rendered dashboard/health pages consume `lib/queries/`; chat polling uses a narrowly scoped Route Handler for read refresh while all authorization remains server-side.
- **Proactive security**: PASS. Every protected read/mutation calls `getServerSession()` through existing guards or new narrow guards and checks responsible ownership or chat participation before selecting sensitive data.
- **Two-layer validation**: PASS. Zod schemas are planned for health records, planned care, documents, dashboard filters, and messages; server-side schemas are the security boundary.
- **Minimal client state**: PASS. Client state stays limited to form fields, selected filters/tabs, open dialogs, pending send/upload states, and polling display refresh. Mutations prefer Server Actions and `useFormState`; chat send can use a Server Action from a client form.
- **No unnecessary dependencies**: PASS. Existing Uploadthing supports upload integration, Zod validates inputs, Prisma handles uniqueness/transactions, and simple polling needs no WebSocket package.
- **TypeScript strict**: PASS. Use Prisma generated types or narrow derivatives. No explicit `any`.
- **Test-first critical paths**: PASS. Tasks must add failing Vitest tests before implementation for ownership isolation, planned-care completion, consultation completion, approval conversation creation, chat archive blocking, and unread/read behavior.

## Project Structure

### Documentation (this feature)

```text
specs/002-health-dashboard-chat/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- server-actions.md
|   |-- routes.md
|   `-- frontend-integration.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- dashboard/
|   |-- page.tsx                         # update responsible dashboard, preserve adopter/admin
|   |-- layout.tsx                       # add unread navigation indicator
|   |-- saude/
|   |   |-- page.tsx                     # new health overview
|   |   |-- agenda/page.tsx              # new agenda list/filter view
|   |   `-- documentos/page.tsx          # new document list/filter view
|   |-- animais/[id]/saude/page.tsx      # update per-animal history/documents entry points
|   |-- mensagens/
|   |   |-- page.tsx                     # new conversation list
|   |   `-- [id]/page.tsx                # new conversation detail
|   `-- solicitacoes/[id]/page.tsx       # add Abrir conversa and archive on completion path
|-- api/
|   |-- uploadthing/route.ts             # reuse existing Uploadthing route
|   `-- mensagens/[id]/route.ts          # required authorized polling read endpoint
components/
|-- app/
|   |-- dashboard/                       # new/updated operational dashboard components
|   |-- saude/                           # update health panel; add overview, agenda, document UI
|   `-- mensagens/                       # new chat list/detail components
lib/
|-- actions/
|   |-- registro-saude.ts                # extend while preserving existing contracts
|   |-- cuidados-planejados.ts           # new planned-care actions
|   |-- documentos-saude.ts              # new document metadata/delete actions
|   |-- solicitacoes.ts                  # integrate conversation create/archive transactions
|   `-- mensagens.ts                     # new send/read actions
|-- queries/
|   |-- health-dashboard.ts              # new overview and agenda queries
|   |-- operational-dashboard.ts         # new source-of-truth dashboard aggregates
|   |-- documentos-saude.ts              # new document queries
|   `-- mensagens.ts                     # new conversation list/detail/unread queries
|-- schemas/
|   |-- registro-saude.ts                # extend discriminated union
|   |-- cuidado-planejado.ts             # new
|   |-- documento-saude.ts               # new
|   |-- dashboard-filters.ts             # new
|   `-- mensagem.ts                      # new
|-- permissions.ts                       # add narrow ownership/participant helpers
|-- upload-router.ts                     # add healthDocument endpoint
`-- tags.ts                             # review public tags after new health enum values
prisma/
|-- schema.prisma                        # additive schema evolution
|-- migrations/                          # new Prisma migration
`-- seed.ts                              # extend seed scenarios
__tests__/
|-- actions/
|   |-- cuidados-planejados.test.ts      # new test-first critical path
|   |-- documentos-saude.test.ts         # new validation/authorization tests
|   |-- mensagens.test.ts                # new chat tests
|   `-- solicitacoes.test.ts             # extend approval/conclusion tests
|-- queries/
|   |-- health-dashboard.test.ts         # new isolation/date grouping tests
|   |-- operational-dashboard.test.ts    # new aggregate isolation tests
|   `-- public-animal.test.ts            # extend privacy checks
`-- schemas/
    |-- registro-saude.test.ts           # extend new categories/date validation
    |-- documento-saude.test.ts          # new
    `-- mensagem.test.ts                 # new
```

**Structure Decision**: Keep the existing App Router, `lib/actions`, `lib/queries`, and `lib/schemas` pattern. Add feature-specific files only where there is concrete use. Do not add a generic repository, notification layer, audit system, queue, cron, WebSocket, or service abstraction.

## Files To Alter

- `prisma/schema.prisma`: add enum values, planned-care/document/chat models, relationships and indexes.
- `prisma/seed.ts`: add deterministic data for overdue/today/future care, consultation, positive test, documents, active chat and archived chat.
- `lib/upload-router.ts`: add `healthDocument` endpoint with image/PDF, 10 MB, ownership validation and internal metadata creation.
- `lib/permissions.ts`: add direct helpers for `ownsPlannedCare`, `ownsHealthDocument`, and chat participant authorization.
- `lib/actions/registro-saude.ts`: extend categories and upsert planned care when `dataProxima` exists.
- `lib/actions/solicitacoes.ts`: create/release conversation during approval transaction and archive conversation during completion transaction.
- `lib/schemas/registro-saude.ts`: preserve existing schemas and add `MEDICAMENTO_TRATAMENTO` and `PROCEDIMENTO` variants plus shared fields.
- `lib/queries/public-animal.ts` and `components/app/animais/public-health-summary.tsx`: keep public summary safe with new enum values and no internal fields.
- `app/dashboard/page.tsx`: replace responsible dashboard implementation with server aggregate query; preserve adopter/admin dashboards except unread indicators.
- `app/dashboard/layout.tsx`: add Mensagens/Saude navigation and unread counter where applicable.
- `app/dashboard/solicitacoes/page.tsx` and `components/app/solicitacoes/request-list.tsx`: accept URL filters instead of client-only status filtering.
- `app/dashboard/solicitacoes/[id]/page.tsx`: add authorized Abrir conversa action for approved requests.
- `__tests__/setup.ts`: add Prisma mocks for new models.
- Existing tests under `__tests__/actions`, `__tests__/queries`, and `__tests__/schemas`: extend where behavior changes.

## New Files To Create

- `lib/actions/cuidados-planejados.ts`
- `lib/actions/documentos-saude.ts`
- `lib/actions/mensagens.ts`
- `lib/queries/health-dashboard.ts`
- `lib/queries/operational-dashboard.ts`
- `lib/queries/documentos-saude.ts`
- `lib/queries/mensagens.ts`
- `lib/schemas/cuidado-planejado.ts`
- `lib/schemas/documento-saude.ts`
- `lib/schemas/dashboard-filters.ts`
- `lib/schemas/mensagem.ts`
- `app/dashboard/saude/page.tsx`
- `app/dashboard/saude/agenda/page.tsx`
- `app/dashboard/saude/documentos/page.tsx`
- `app/dashboard/mensagens/page.tsx`
- `app/dashboard/mensagens/[id]/page.tsx`
- `app/api/mensagens/[id]/route.ts` for required authorized chat polling reads.
- Components under `components/app/saude`, `components/app/dashboard`, and `components/app/mensagens` for the concrete screens.
- Test files listed in Project Structure.

## Complexity Tracking

No constitution violations require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
