<!--
Sync Impact Report
Version change: 1.1.0 -> 1.2.0
Reason: align governance with the homologated two-application architecture.
Modified principles:
- III. Server-Side by Default: trusted work remains server-side in the root
  backend; the official frontend may use protected HTTP contracts.
- VI. Minimal Client State: HTTP mutations are the approved pattern for the
  separate TanStack frontend; Server Actions remain an option only in Next.js
  backend surfaces.
Modified sections:
- AdoptPlace Technology Stack: documents the official TanStack Start/Vite
  frontend and the root Next.js backend/service authority.
- Development Workflow and Quality Gates: makes the protected HTTP boundary,
  DTOs, and prohibition on browser Prisma/database access explicit.
Updated templates: none; existing feature-003 templates already describe the
split architecture.
Follow-up TODOs: future specs must run the Constitution Check against both
applications and must not treat legacy/frontend-antigo as an implementation
surface.
-->

# AdoptPlace Constitution

## Core Principles

### I. Zero Over-Engineering
AdoptPlace MUST implement only the abstractions required by current functional
requirements. New layers, repositories, generic factories, shared frameworks, and
cross-feature abstractions MUST NOT be added unless a current requirement uses
them directly in at least two concrete places. Complexity MUST be justified in the
implementation plan before work begins.

Rationale: the project favors maintainable, direct feature delivery over
speculative architecture.

### II. Schema First
The Prisma schema is the source of truth for all persisted data, relationships,
enums, and constraints. Data model changes MUST start in `prisma/schema.prisma`
and flow through Prisma migrations and generated Prisma types. Application code
MUST use Prisma Client or APIs built on top of Prisma Client; raw SQL MUST NOT be
written in application code, migrations outside Prisma, or route handlers.

Rationale: one authoritative schema prevents model drift and keeps database
changes reviewable.

### III. Server-Side by Default
Business logic MUST run in the root Next.js backend, in Route Handlers,
Server Actions where applicable, or server-only modules. The official frontend
in `frontend/` MAY consume protected HTTP contracts and hold presentation and
transient interaction state. Browser code MUST NOT own business rules,
authorization decisions, persistence rules, or trusted transformations.

Rationale: server-side logic keeps security, validation, and data access under
controlled execution contexts.

### IV. Proactive Security
Any code path that reads or writes user-specific, protected, or sensitive data
MUST call `getServerSession()` and verify authorization before accessing data.
Public routes MUST NOT expose sensitive fields, internal identifiers beyond the
feature need, secrets, credentials, tokens, or private user data. Upload handling
MUST validate ownership, file type, and feature-specific permissions before data
is persisted or returned.

Rationale: authorization after data access is too late; sensitive data must never
cross a public boundary by accident.

### V. Two-Layer Validation
User input MUST be validated with Zod on the client for immediate UX feedback and
validated again with Zod on the server before any trusted operation. Server-side
schemas are the security boundary. Client-side validation MUST NOT be treated as
proof that data is safe.

Rationale: client validation improves usability, while server validation protects
the system.

### VI. Minimal Client State
Client state MUST be limited to transient UI concerns such as open dialogs,
selected tabs, pending visual states, and controlled form fields. Mutations MUST
use the approved protected HTTP contracts when initiated by `frontend/`; the
root Next.js backend remains the authority that authenticates, authorizes,
validates, and persists them. Server Actions with `useFormState` remain an
option for any Next.js UI surface. Manual `useState` plus `fetch` flows outside
the documented HTTP client boundary require a documented reason in the plan.

Rationale: fewer client-side data flows reduce bugs, stale state, and duplicated
server behavior.

### VII. No Unnecessary Dependencies
Before adding a package, the implementation plan MUST verify that Next.js,
Prisma, NextAuth, Zod, Tailwind, shadcn/ui, Uploadthing, or TypeScript do not
already provide the required capability. New runtime dependencies MUST map to a
current functional requirement, include a clear owner, and avoid duplicating
existing stack behavior.

Rationale: every dependency increases maintenance, bundle risk, and security
surface.

### VIII. TypeScript Strict
`tsconfig.json` MUST keep `strict: true`. Explicit `any` is forbidden in source,
tests, and generated-adjacent project code, except for third-party generated
files outside project control. Entity types MUST come from Prisma generated types
or narrow feature-specific types derived from them. Unsafe casts MUST include a
local validation or narrowing step.

Rationale: strict types turn schema and validation guarantees into compiler
feedback.

### IX. Test-First for Critical Paths
Server Actions and Route Handlers that enforce authorization, ownership
isolation, multi-step state transitions, or business rules with
side effects MUST have an automated Vitest test derived directly from
the corresponding FR or CR before the implementation task is considered
complete. The test MUST fail against a missing or naive implementation
and pass against the correct one. UI components, Zod schemas without
conditional business logic, read-only queries, and seed/config files
are exempt from this gate.

Rationale: critical paths carry the highest failure cost (data leaks
between organizations, broken adoption guarantees) and the highest risk
of subtle errors when generated by lower-capability models. A failing
test is a cheaper and more reliable gate than manual review alone.

## AdoptPlace Technology Stack

AdoptPlace is two applications in one repository. `frontend/` is the sole
official public interface and uses React, TanStack Start/Router, Vite, Tailwind
CSS, TypeScript strict, React Query, React Hook Form and client-side Zod for UX.
The repository root is the backend/service authority and uses Next.js 15 App
Router, NextAuth v5, Prisma 5.x, PostgreSQL 16, Zod 3.x, Uploadthing and
server-side TypeScript strict.

The frontend communicates with the backend only through documented HTTP
contracts, normally same-origin or a documented reverse proxy. Route Handlers
authenticate, authorize, validate with Zod, apply business rules, and return
narrow DTOs. Prisma Client, database credentials, direct PostgreSQL access,
trusted authorization, and business-rule enforcement MUST NOT exist in browser
code. `legacy/frontend-antigo/` is historical reference only and MUST NOT
receive implementation work. Plans and tasks MUST assume this split stack unless
the constitution is amended first.

## Development Workflow and Quality Gates

Every feature plan MUST pass the Constitution Check before Phase 0 research and
again after Phase 1 design. The check MUST confirm:

- No abstraction exists without a current functional requirement.
- Data model changes start in `prisma/schema.prisma` and use Prisma migrations.
- Business logic is assigned to root-backend Route Handlers, Server Actions
  where applicable, or server-only modules; frontend mutations use documented
  protected HTTP contracts rather than browser-owned rules.
- Protected data access calls `getServerSession()` before reading or writing
  data.
- Zod validation exists on both client and server for user input.
- Frontend mutations use the documented HTTP client boundary; they do not
  import Prisma, use database credentials, or bypass backend authorization and
  Zod validation.
- New dependencies are rejected unless the existing stack cannot satisfy the
  requirement.
- `strict: true`, Prisma generated entity types, and no explicit `any` are
  maintained.
- A Vitest test exists, is red against a missing implementation, and
  passes against the correct one for every task marked [TEST-FIRST].

Code review MUST block changes that violate these gates. Any exception requires
an amendment to this constitution, not a one-off implementation note.

## Governance

This constitution supersedes conflicting project habits, generated templates,
and ad hoc implementation preferences. Amendments require an explicit change to
this file, a Sync Impact Report, updated dependent templates, and a documented
semantic version change.

Versioning follows semantic versioning:

- MAJOR: removes, weakens, or redefines an existing inviolable rule.
- MINOR: adds a new principle, mandatory section, or material quality gate.
- PATCH: clarifies wording without changing obligations.

All feature specifications, plans, tasks, and reviews MUST verify compliance with
the current constitution. If implementation needs conflict with a principle, the
constitution MUST be amended before the implementation proceeds.

**Version**: 1.2.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-08-05
