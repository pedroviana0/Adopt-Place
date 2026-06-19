# Implementation Plan: Animal Adoption Management

**Branch**: `001-animal-adoption-management` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-animal-adoption-management/spec.md`

## Summary

Build AdoptPlace as a full-stack Next.js App Router application for the complete
rescued-animal lifecycle: public showcase and animal profiles, adopter
registration and standardized screening, animal and health management for
organizations and independent fosters, adoption requests, favorites,
completed-adoption history, alerts, and administrator account control.

The implementation is schema-first: generate `prisma/schema.prisma` before
application code, then implement business rules in Server Actions by default and
Route Handlers only for auth/upload integration points that require them.

## Technical Context

**Language/Version**: TypeScript 5.x strict, Next.js 15 App Router

**Primary Dependencies**: NextAuth v5, Prisma 5.x, Zod 3.x, Tailwind CSS v4, shadcn/ui, Uploadthing, bcryptjs

**Storage**: PostgreSQL 16 via Prisma schema and Prisma Client. SQLite is an
allowed local fallback through Prisma provider switching only; production target
remains PostgreSQL.

**Testing**: Vitest for automated unit and integration tests on tasks marked [TEST-FIRST] (Principle IX). Test files live in __tests__/ mirroring the lib/ structure. Manual acceptance validation from quickstart.md for all other tasks. TypeScript, lint, Prisma validation, and build checks run in Phase 10.
lint, Prisma validation, and targeted unit/integration tests where tasks request
them.

**Target Platform**: Next.js web application

**Project Type**: Web application

**Performance Goals**: Public showcase and filter updates return a visible
result, empty state, or pagination update in under 2 seconds for expected
Volta Redonda/RJ data volume; 12 animals per page.

**Constraints**: Server-side business logic by default; Prisma schema is the
source of truth; no raw SQL; `getServerSession()` before protected data access;
Zod validation on client and server; no explicit `any`; no unnecessary
dependencies.

**Scale/Scope**: Supports the two initial client operating models without code
changes: Cia Animal VR as an informal foster network and SPA-VR as a formal ONG
with physical shelter and 100+ animals.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero over-engineering**: PASS. The plan uses direct App Router pages, Server
  Actions, Prisma Client, Zod schemas, and shadcn/ui components. No repository,
  service framework, or generic abstraction is introduced.
- **Schema first**: PASS. `prisma/schema.prisma` is the first implementation
  artifact and is the source of truth for enums, entities, relationships, and
  uniqueness constraints. XOR and bidirectional relationship rules are enforced
  in Server Actions because Prisma schema cannot express them portably.
- **Server-side by default**: PASS. Mutations live in `lib/actions/` and server
  route groups. `app/api/` is reserved for NextAuth and Uploadthing or cases
  where a Route Handler is required.
- **Proactive security**: PASS. Every dashboard action and protected read calls
  `getServerSession()` and verifies role, active account, and ownership before
  reading or writing data. Public pages return only public animal/responsible
  data.
- **Two-layer validation**: PASS. Zod schemas in `lib/schemas/` are shared by
  forms for UX and Server Actions for trusted validation.
- **Minimal client state**: PASS. Client state is limited to form controls,
  filters, pagination controls, selected tabs/dialogs, and pending UI states.
  Mutations prefer Server Actions and `useFormState`.
- **No unnecessary dependencies**: PASS. Dependencies are limited to the declared
  stack plus `bcryptjs` for credential password hashing, which is required by
  RF01/RNF02.
- **TypeScript strict**: PASS. `strict: true`, Prisma generated types, and
  narrow Zod-inferred types are required. Explicit `any` is forbidden.

## Project Structure

### Documentation (this feature)

```text
specs/001-animal-adoption-management/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- server-actions.md
|   `-- routes.md
`-- tasks.md
```

### Source Code (repository root)

```text
app/
|-- (auth)/
|   |-- login/
|   |-- cadastro/
|   |-- cadastro/adotante/
|   |-- cadastro/organizacao/
|   `-- cadastro/acolhedor/
|-- (public)/
|   |-- page.tsx
|   `-- animais/[id]/page.tsx
|-- dashboard/
|   |-- page.tsx
|   |-- triagem/
|   |-- animais/
|   |-- solicitacoes/
|   |-- favoritos/
|   |-- adotantes/
|   `-- admin/usuarios/
|-- api/
|   |-- auth/[...nextauth]/route.ts
|   `-- uploadthing/route.ts
`-- globals.css
components/
|-- ui/
`-- app/
    |-- animais/
    |-- auth/
    |-- dashboard/
    |-- saude/
    |-- solicitacoes/
    `-- vitrine/
lib/
|-- auth.ts
|-- prisma.ts
|-- schemas/
|-- actions/
|-- queries/
|-- permissions.ts
`-- tags.ts
prisma/
|-- schema.prisma
|-- migrations/
`-- seed.ts
types/
`-- next-auth.d.ts
```

**Structure Decision**: The application stays in one Next.js repository. Route
groups separate public, auth, and dashboard experiences. `lib/actions/` holds
server-side mutations; `lib/queries/` holds server-only read helpers for
server-rendered pages; `lib/schemas/` centralizes Zod validation; `components/ui/`
is generated shadcn/ui and `components/app/` contains AdoptPlace domain UI.

## Complexity Tracking

No constitution violations require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
