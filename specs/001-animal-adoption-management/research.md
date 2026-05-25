# Research: Animal Adoption Management

## Decision: Next.js App Router as the full-stack boundary

**Rationale**: App Router supports public server-rendered pages, authenticated
dashboard pages, Server Actions for mutations, and Route Handlers for auth/upload
integration in one repository. This matches the constitution's server-side
default and avoids API boilerplate.

**Alternatives considered**: Separate frontend/backend apps would add deployment
and auth/session complexity without current functional requirements. A pure API
backend would duplicate business boundaries already covered by Server Actions.

## Decision: Prisma schema first with PostgreSQL production target

**Rationale**: The schema encodes enums, relationships, uniqueness, and generated
types for the whole product. PostgreSQL 16 is the production target and supports
the real data volume of a shelter with 100+ animals. SQLite may be used locally
only by changing Prisma provider configuration for developers without Docker.

**Alternatives considered**: Handwritten SQL is forbidden by the constitution.
Maintaining separate dev schema variants would increase drift risk.

## Decision: Server Actions for business mutations

**Rationale**: Animal CRUD, health records, relationships, favorites, triage, and
adoption decisions need session, role, ownership, and validation checks before
data access. Server Actions keep form-driven flows direct and minimize client
state.

**Alternatives considered**: Manual client `fetch` to route handlers would add
duplicate request code and more client state. Route Handlers remain reserved for
NextAuth, Uploadthing, and integrations that require HTTP endpoints.

## Decision: Shared Zod schemas for forms and trusted validation

**Rationale**: The same domain schemas can provide immediate form feedback and
server-side enforcement. Server validation remains authoritative for CPF/e-mail
uniqueness, date ordering, XOR animal ownership, request eligibility, and
role-based restrictions.

**Alternatives considered**: Client-only validation is insecure. Duplicated
client/server validators would drift.

## Decision: Standardized adopter screening

**Rationale**: One screening form for all adopters keeps comparisons consistent
for Cia Animal VR, SPA-VR, and independent fosters. It also avoids a dynamic form
builder, which would violate zero over-engineering for the current scope.

**Alternatives considered**: Custom screening per responsible party was rejected
because no current requirement needs per-organization question sets.

## Decision: Unified health record model

**Rationale**: A single `RegistroSaude` model covers vaccines, parasite control,
and disease tests while preserving type-specific nullable fields. This supports
the public health summary, upcoming alerts, and all acceptance criteria without
three unrelated tables.

**Alternatives considered**: Separate tables for each health category would
increase query and UI duplication for the same animal health timeline.

## Decision: Derived animal tags, no tag table

**Rationale**: Tags are deterministic from existing animal and health data:
porte, sexo, castrado, vacinado, vermifugado, and testado. Deriving them avoids
stale data and satisfies the user's rule that tags are not stored.

**Alternatives considered**: Persisted tags were rejected because they duplicate
source data and create synchronization work.

## Decision: Approval resolves competing requests

**Rationale**: When one request is approved, remaining `EM_ANALISE` requests for
the same animal are automatically set to `RECUSADA`. This prevents conflicting
parallel decisions and creates a clear testable outcome.

**Alternatives considered**: Manual cleanup leaves ambiguous state. Blocking
approval until all requests are individually handled slows the primary workflow.

## Decision: Public data minimization

**Rationale**: Public animal pages show only public responsible name, city, and
responsible type. Phone, e-mail, CPF, CNPJ, full address, internal notes, and
adopter data stay out of public pages.

**Alternatives considered**: Public contact information was rejected to reduce
privacy risk and avoid exposing personal/organization operational data.

## Decision: Seed data mirrors the two real operating models

**Rationale**: Development seed data must include Cia Animal VR, SPA-VR, an
independent foster, adopters with and without screening, admin, varied animals,
health records, related pairs, favorites, and one request. This makes every
major workflow testable locally.

**Alternatives considered**: Minimal seed data would make acceptance validation
slower and easier to miss.
