# Research: Backend Frontend Integration

## Decision: Keep two deployable apps, with `frontend/` as public UI and root as backend/service

Rationale: The repository currently contains a TanStack Start/Vite app in `frontend/` and a Next.js backend root with NextAuth, Prisma, route handlers, server actions, queries, schemas and tests. The clarified spec says `frontend/` is the only public interface and the root is service-only.

Alternatives considered:
- Merge the Lovable frontend into the Next.js root: rejected for this feature because it expands scope and increases risk before contracts are audited.
- Keep both public UIs: rejected because it contradicts the clarified definition of one public interface.

## Decision: Preserve NextAuth and prefer secure cookie session via same-origin/proxy

Rationale: `lib/auth.ts` already configures NextAuth v5 with Credentials, PrismaAdapter and JWT session enrichment. Replacing it with a custom JWT would duplicate security-sensitive behavior without proven need. Same-origin or reverse proxy reduces CORS and cookie complexity between separated apps.

Alternatives considered:
- Custom JWT auth: rejected unless a later proof shows NextAuth cannot satisfy the needed flow.
- Cross-origin cookies as the default: deferred because it requires more cookie/CORS decisions and is riskier for the first proof.

## Decision: Use backend HTTP DTOs, not Prisma model payloads

Rationale: Prisma models include fields that must not be public in several contexts. Public animal pages, request reviews, admin tables, health documents and chat all need different allowlists. DTOs also give Arthur/Claude stable frontend-facing shapes without giving `frontend/` database access.

Alternatives considered:
- Return Prisma objects directly: rejected because it risks leaking sensitive fields and tightly couples frontend to storage.
- Generate client code immediately: deferred; no new dependency or generator is justified before the contract inventory is complete.

## Decision: First delivery is audit, matrix and HTTP contract inventory

Rationale: `frontend/src/lib/data/*.ts` currently contains synchronous mock/localStorage functions, while backend capabilities are mostly server actions and queries rather than public HTTP contracts. The first useful step is mapping gaps and contracts before implementation.

Alternatives considered:
- Implement all contracts immediately: rejected as too broad and likely to create large PRs.
- Start with frontend mock removal: rejected because removing mocks before backend contracts work would break flows.

## Decision: Remove mocks per module only after the real flow works

Rationale: Current modules `sessao.ts`, `usuarios.ts`, `animais.ts`, `favoritos.ts`, `solicitacoes.ts`, `saude.ts`, `catalogos.ts`, `db.ts` and `seed.ts` provide the functioning frontend behavior. Removing them globally would create a large failure surface. Per-flow removal keeps verification small.

Alternatives considered:
- Replace all `frontend/src/lib/data` at once: rejected because it couples unrelated flows and makes failures hard to isolate.

## Decision: Treat schema changes as exceptional and homologation-gated

Rationale: The current Prisma schema already includes feature 001 and 002 entities. Integration may reveal gaps, but the user explicitly forbids seed/reset/migration against the original database and requires homologation for DB changes.

Alternatives considered:
- Migrate immediately during feature planning: rejected because this step is documentation and DB impact must be proven first.
