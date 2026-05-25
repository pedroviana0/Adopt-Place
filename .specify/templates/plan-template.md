# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the remaining placeholder content with concrete
  technical details for this feature. The fixed stack values come from the
  AdoptPlace Constitution and must not be changed without amending it.
-->

**Language/Version**: TypeScript 5.x strict, Next.js 15 App Router

**Primary Dependencies**: NextAuth v5, Prisma 5.x, Zod 3.x, Tailwind CSS v4, shadcn/ui, Uploadthing

**Storage**: PostgreSQL 16 via Prisma schema and Prisma Client

**Testing**: [Project test commands or NEEDS CLARIFICATION]

**Target Platform**: Next.js web application

**Project Type**: Web application

**Performance Goals**: [domain-specific, e.g., p95 response time or NEEDS CLARIFICATION]

**Constraints**: [domain-specific constraints plus constitution constraints or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific scope, e.g., users, records, screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Zero over-engineering**: Document every new abstraction and the current FR
  that requires it. Prefer direct Server Actions, Route Handlers, Prisma Client,
  and shadcn/ui primitives.
- **Schema first**: Identify all model changes in `prisma/schema.prisma`.
  Confirm Prisma migrations and generated Prisma types are used. Raw SQL is not
  allowed.
- **Server-side by default**: Place business logic in Server Actions, Route
  Handlers, or server-only modules. Client Components are limited to UI concerns.
- **Proactive security**: Protected data paths call `getServerSession()` and
  authorize before data access. Public routes expose no sensitive fields.
- **Two-layer validation**: Define client Zod schemas for UX and server Zod
  schemas for security before trusted operations.
- **Minimal client state**: Mutations prefer `useFormState` and Server Actions.
  Any manual `useState` plus `fetch` mutation flow is justified here.
- **No unnecessary dependencies**: New packages require proof that Next.js,
  Prisma, NextAuth, Zod, Tailwind, shadcn/ui, Uploadthing, and TypeScript do not
  cover the need.
- **TypeScript strict**: Confirm `strict: true`, no explicit `any`, and entity
  types are Prisma generated types or narrow derivatives.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md              # This file (/speckit-plan command output)
|-- research.md          # Phase 0 output (/speckit-plan command)
|-- data-model.md        # Phase 1 output (/speckit-plan command)
|-- quickstart.md        # Phase 1 output (/speckit-plan command)
|-- contracts/           # Phase 1 output (/speckit-plan command)
`-- tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Keep the App Router, Prisma, validation, and auth boundaries
  explicit so constitution checks remain reviewable.
-->

```text
app/
|-- (routes)/
|-- api/
`-- actions/
components/
|-- ui/
`-- [feature-components]/
lib/
|-- auth/
|-- prisma/
`-- validations/
prisma/
`-- schema.prisma
tests/
|-- integration/
`-- unit/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., new service layer] | [current FR] | [why direct Server Action or Route Handler is insufficient] |
| [e.g., manual client fetch mutation] | [specific UX need] | [why useFormState plus Server Action is insufficient] |
| [e.g., new dependency] | [specific capability missing from stack] | [why current stack cannot cover it] |
