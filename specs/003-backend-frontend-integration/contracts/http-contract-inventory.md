# HTTP Contract Inventory

This document closes the initial documentation gate for Issue #20. It is an
inventory and a contract-definition guide, not endpoint implementation. Only the
authentication proof in this document has exact contracts and may move to
`contract defined`; every other group remains `to define` until its own backend
Issue documents the same required fields.

## Verified HTTP Baseline

Concrete backend HTTP route groups present in the repository:

- `app/api/auth/[...nextauth]/route.ts`: NextAuth/Auth.js GET and POST actions
  under `/api/auth/*`.
- `app/api/mensagens/[id]/route.ts`: participant-scoped message polling.
- `app/api/uploadthing/route.ts`: Uploadthing transport.

Server Actions and queries under `lib/` are backend implementation evidence,
not HTTP contracts for the separately deployed frontend. A path marked
**planned** below does not exist until its implementation Issue is merged.

## Required Contract Record

Every later contract definition MUST contain all fields in this template before
its matrix row can move to `contract defined`.

| Field | Required evidence |
|-------|-------------------|
| Contract ID and flow | Stable identifier, matrix Flow ID, owning backend Issue, dependent frontend Issue |
| Method and path | Exact HTTP method/path and whether the route is `existing` or `planned` |
| Auth mode | `public`, `authenticated`, `role-scoped`, `owner-scoped`, `participant-scoped`, or `admin-only` |
| Cookie and CSRF behavior | Whether credentials are included, whether NextAuth CSRF is required, and same-origin/proxy assumption |
| Request DTO | Path/query/body fields, content type, Zod schema, normalization, and unknown-field policy |
| Response DTO | Explicit field allowlist, nullability, pagination when applicable, and ISO date serialization |
| Sensitive exclusions | Fields that MUST NOT cross this boundary even when Prisma can select them |
| Errors | Status code, stable machine code, safe message, validation details, and no resource-existence leak |
| Backend source | Existing auth, permission, action, query, schema, and Prisma source used by the handler |
| Tests | Success, validation, 401, 403, ownership/participation, transition, and sensitive-field tests applicable to the flow |
| Frontend dependency | Arthur Issue, consumer files/areas, and the exact mock/localStorage removal condition |
| Deployment dependency | Relative URL/proxy requirement, environment assumption, and any configuration still pending |
| Status and evidence | Lifecycle status plus test/PR/command references that justify it |

## Common HTTP Rules

- The official frontend calls relative `/api/*` URLs with browser credentials.
  Prisma and PostgreSQL remain backend-only.
- Application-owned contracts use JSON. NextAuth endpoints keep the framework's
  verified form and redirect-response protocol; they are not wrapped in an
  application JSON envelope.
- Application-owned errors use
  `{ "error": { "code": string, "message": string, "fieldErrors"?: object } }`.
  Validation uses 400, missing session 401, and an authenticated user without
  the required active/role/ownership/participation permission uses 403. A
  contract may use 404 instead of 403 when revealing resource existence would
  disclose protected data, but it must document and test that choice.
- Inputs are parsed by a server-side Zod schema. Client validation is only a UX
  aid and never the trust boundary.
- Response DTOs are explicit allowlists. Route handlers MUST NOT serialize a
  Prisma model, `include` result, error object, token, cookie, or database record
  directly.
- Date/time values crossing the boundary are ISO 8601 strings. Enum values come
  from the Prisma-backed source of truth.
- Protected identity and profile IDs come from the verified NextAuth session,
  never from browser-supplied `usuarioId`, `adotanteId`, `organizacaoId`, or
  `acolhedorId`.
- Protected contracts must verify the current active-account state. The
  `ativo` claim captured when a JWT was issued is not sufficient evidence after
  an administrator may have deactivated the account.
- Mocks and localStorage are removed only after the corresponding backend
  contract is implemented, validated, consumed by `frontend/`, and accepted.

## Public DTO Allowlist Rules (T016)

Public contracts return only fields needed to browse adoptable animals.

| DTO group | Allowed fields proven by current backend queries | Always excluded |
|-----------|--------------------------------------------------|-----------------|
| PublicAnimalSummaryDTO | animal `id`, `nome`, `porte`, `sexo`, `idadeEstimada`, `castrado`, `status`; primary photo URL; species/breed names; derived public tags; responsible display name and city | responsible IDs and contacts, user/profile IDs, CPF/CNPJ, e-mail, phone, full address, health notes/details, requests, favorites, documents, chat |
| PublicAnimalDetailDTO | summary fields plus `cor`, `descricao`, `criadoEm`, ordered public photos, allowlisted completed-health summary, and related public-animal summaries | `responsavelRegistro`, `observacoes`, `profissionalClinica`, document metadata/URLs, screening, adopter/request data, internal ownership fields |
| PublicMetricsDTO | `availableAnimals`, `completedAdoptions`, `responsibleParties` | source rows, organization/foster lists, private account/profile fields |
| PublicCatalogDTO | species `id`/`nome`, breeds `id`/`nome`/`especieId`, available-animal cities, and the documented showcase tag values | private addresses and contacts; vaccine/disease catalogs remain a gap until a later Issue proves a public need and source |
| PaginationDTO | `page`, `perPage`, `total`, `totalPages` | internal cursor/database information |

Evidence: `lib/queries/animal-showcase.ts`,
`lib/queries/public-animal.ts`, `lib/queries/public-metrics.ts`,
`lib/schemas/showcase.ts`, and `lib/tags.ts`. These rules do not define final
public endpoint paths; Issue #26 owns that work.

## Protected DTO Allowlist Rules (T017)

Every protected group applies the smallest role/ownership scope before selecting
data. Fields listed as allowed are categories to be narrowed by the group Issue,
not permission to return complete Prisma records.

| DTO group | Allowed for the authorized caller | Required exclusions and boundary |
|-----------|-----------------------------------|----------------------------------|
| SessionDTO | user `id`, `email`, `tipoPerfil`, `ativo`, nullable scoped profile IDs, session expiry | password hash, CPF/CNPJ, phone, address, screening, tokens, cookie values, adapter records; exact proof defined below |
| ProfileDTO | own role-specific editable/display fields and immutable CPF/CNPJ as read-only where required | another profile's data, password hash, screening outside its contract; organization/foster `fotoUrl` remains an unproven schema gap |
| ScreeningDTO | adopter's own screening fields; owner review receives only the read-only fields needed for a request concerning its own animal | public access, unrelated owners, admin implicit access, credentials and unrelated profile data |
| FavoriteDTO | current adopter's animal reference, favorite state, creation date, and safe animal summary | caller-supplied adopter identity and another adopter's favorites |
| AdoptionRequestDTO | role-specific request ID/status/timestamps and the minimum animal/adopter view needed by that caller | private screening/contact data outside owner review, another adopter/owner data, browser-controlled transition identity |
| OwnedAnimalDTO | owned animal management fields, taxonomy, photos, relationships, and owner-safe health references | another responsible party's animals and unrelated private user/profile data |
| HealthDTO | owned animal's records, planned care, alerts, timeline, and only fields required by the selected health operation | public/private cross-leak, unrelated owner data, internal fields outside the operation; CONSULTA never becomes clinical history |
| DashboardDTO | aggregates calculated for the authenticated adopter/responsible/admin contract | raw rows, another responsible party's aggregates, private details not needed by the metric |
| ChatDTO | participant's conversation/message fields, unread state, approval/archive state | non-participants, pre-approval access, admin implicit access, sender credentials; archived conversations reject sends |
| AdminUserDTO | account `id`, `email`, `tipoPerfil`, `ativo`, creation date, and minimal display name/profile discriminator | `senhaHash`, CPF/CNPJ, screening, full address, health, request, document, and chat data |

Final profile, favorite, request, animal, health, dashboard, chat, and admin
methods/paths remain `to define` in their approved backend Issues.

## Authentication Proof Contracts (T018)

The proof preserves NextAuth v5 Credentials and its encrypted JWT session cookie.
It does not introduce a custom bearer token or expose the cookie value to
JavaScript.

### AUTH-CSRF-01 - Existing NextAuth CSRF

- **Method/path**: `GET /api/auth/csrf` (`existing` through
  `app/api/auth/[...nextauth]/route.ts`).
- **Auth mode**: public transport prerequisite.
- **Response**: NextAuth `{ "csrfToken": string }` and its HTTP-only CSRF cookie.
- **Use**: the token is posted back for login/logout using NextAuth's
  double-submit-cookie protocol.
- **Security**: the token is not persisted in application storage or logged.

### AUTH-LOGIN-01 - Existing Credentials Login

- **Method/path**: `POST /api/auth/callback/credentials` (`existing` through the
  NextAuth catch-all route).
- **Request**: `application/x-www-form-urlencoded` with `email`, `password`,
  `csrfToken`, and a same-origin `callbackUrl`; header
  `X-Auth-Return-Redirect: 1`.
- **Response**: NextAuth redirect JSON protocol and `Set-Cookie` on success. The
  frontend adapter interprets only safe result/error codes and never persists
  the password or session token.
- **Backend source**: `lib/auth-credentials.ts` credentials schema, `Usuario`
  lookup, bcrypt comparison, and active-account check; `lib/auth.ts` NextAuth
  configuration, JWT callback, and session callback.
- **Issue #21 validation**: valid active credentials create a safe identity;
  invalid credentials do not reveal whether account/e-mail exists; an inactive
  account is blocked with the approved message. The existing NextAuth
  callback/cookie boundary is preserved.

### AUTH-SESSION-01 - Protected Application Session DTO

- **Method/path**: `GET /api/session` (**existing**, implemented by Issue #21 in
  `app/api/session/route.ts`).
- **Auth mode**: authenticated and active account.
- **Request**: no body; browser sends the secure NextAuth cookie through the
  same-origin/proxy boundary.
- **200 response DTO**:

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "tipoPerfil": "ADOTANTE | ORGANIZACAO | ACOLHEDOR | ADMIN",
    "ativo": true,
    "adotanteId": "string | null",
    "organizacaoId": "string | null",
    "acolhedorId": "string | null"
  },
  "expires": "ISO-8601 string"
}
```

- **Errors**: 401 `UNAUTHENTICATED` without a valid session; 403
  `INACTIVE_ACCOUNT` with
  `Conta desativada. Entre em contato com o administrador` when the account is
  inactive.
- **Explicit exclusions**: `senhaHash`, password, JWT/token, cookie, CSRF token,
  NextAuth adapter account/session records, CPF, CNPJ, phone, address, screening
  answers, health, requests, documents, and chat.
- **Backend source**: `app/api/session/route.ts`, `lib/auth.ts`,
  `getServerSession()`, `lib/actions/auth-guards.ts`, `lib/permissions.ts`, and
  the current `Usuario.ativo` value. The route revalidates the active account
  instead of trusting only a possibly stale JWT claim.
- **Issue #21 validation**: `__tests__/api/session.test.ts` proves exact safe DTO
  keys, 401 without session, inactive-account blocking, role/scoped ID mapping,
  and sensitive-field exclusion. Cookie-backed reload and logout remain
  frontend acceptance work in Issue #22.
- **Frontend dependency**: Issue #22 may replace
  `frontend/src/lib/data/sessao.ts` only after Issue #21 marks this contract
  `backend ready`.

The existing `GET /api/auth/session` remains NextAuth protocol and returns a
session or `null`; it is not changed to 401. `AUTH-SESSION-01` is the
application-owned protected boundary required by T021.

### AUTH-LOGOUT-01 - Existing NextAuth Logout

- **Method/path**: `POST /api/auth/signout` (`existing` through the NextAuth
  catch-all route).
- **Request**: `application/x-www-form-urlencoded` with `csrfToken` and a
  same-origin `callbackUrl`; header `X-Auth-Return-Redirect: 1`.
- **Response**: NextAuth redirect JSON protocol and expired/cleared session
  cookie.
- **Required Issue #21/#22 checks**: session endpoint returns 401 after logout;
  protected frontend navigation redirects; no localStorage session remains after
  frontend integration.

## Publication and Proxy Decision (T019)

**Decision**: production and homologation use one public HTTPS origin. A reverse
proxy routes `/api/*` to the root Next.js backend and all active visual routes to
the TanStack Start application in `frontend/`. The browser therefore calls
relative `/api/*` paths and uses the default secure, HTTP-only, `SameSite=Lax`,
path `/` Auth.js cookies. The root visual pages are not a public fallback.

Current configuration evidence:

- `next.config.ts` is empty and has no CORS, rewrite, or cookie override.
- `frontend/vite.config.ts` configures TanStack Start only and has no API proxy.
- `.env.example` defines `NEXTAUTH_URL=http://localhost:3000`; production must
  set `NEXTAUTH_URL`/`AUTH_URL` to the public HTTPS origin and keep the secret
  server-only.
- No deployment manifest or reverse-proxy configuration exists in the
  repository.

Consequences:

- No config file is changed by Issue #20.
- A later deployment Issue must provide and validate the production reverse
  proxy; provider-specific syntax is intentionally not invented here.
- Before Issue #22 manual development, a frontend-owned config change may add a
  development-only `/api` proxy to the local backend. Arthur owns
  `frontend/vite.config.ts`; Pedro owns the backend/deployment contract. The
  proxy must not expose `DATABASE_URL`, auth secrets, Uploadthing secrets, or
  cross-origin wildcard credentials.
- A cross-origin fallback is blocked until a separate security decision defines
  exact allowed origins, credentialed CORS, cookie domain, `Secure`,
  `SameSite`, CSRF, and callback URL behavior. `Access-Control-Allow-Origin: *`
  with credentials is forbidden.

## Remaining Contract Groups

| Contract group | Frontend source today | Backend source of truth today | Auth mode | Status / next owner |
|----------------|-----------------------|-------------------------------|-----------|---------------------|
| Session/login/logout | `frontend/src/lib/data/sessao.ts` | `lib/auth.ts`, `lib/auth-credentials.ts`, auth routes, auth guards/permissions | NextAuth cookie + protected session DTO | `backend ready`; frontend #22 |
| Public showcase/detail/metrics/catalogs | `animais.ts`, `catalogos.ts`, public routes | public animal/showcase/metrics queries, showcase schema, tags | Public | `to define`; #26 |
| Registration | `usuarios.ts`, `cadastro.*.tsx` | adopter registration action/schema; organization/foster backend gaps | Public validated mutation | `to define`; #29 |
| Profile and screening | `usuarios.ts`, profile/triagem routes | triagem action/schema, auth/session; profile action gap | Authenticated, role scoped | `to define`; #29; photo decision remains blocked |
| Favorites | `favoritos.ts` | favorite action/query/schema | ADOTANTE only | `to define`; #32 |
| Adopter requests | `solicitacoes.ts` | request actions/guards/queries/schemas | ADOTANTE only | `to define`; #32 |
| Owner request review | `solicitacoes.ts`, owner request routes | owner request queries/action/decision schema | ORGANIZACAO/ACOLHEDOR owner scoped | `to define`; #43 |
| Animal management | `animais.ts`, owner animal routes | animal/photo/relationship/search actions, owner query, schemas | ORGANIZACAO/ACOLHEDOR owner scoped | `to define`; #35 |
| Uploads | `frontend/src/lib/upload.ts` and future document UI | upload router and Uploadthing route | Owner scoped where protected | transport exists; flow contracts `to define`; #35/#51 |
| Feature 001 health | `saude.ts` | health action, alerts query, schema | ORGANIZACAO/ACOLHEDOR owner scoped | `to define`; #44 |
| Feature 002 health center | incomplete frontend surface | planned-care action/query/schema | Owner scoped | blocked on audit #48, then #49 |
| Health documents | missing frontend surface | document action/query/schema/upload | Owner scoped and private | blocked on audit #48, then #51 |
| Dashboards | dashboard routes | adopter/operational/admin queries | Role and owner scoped | feature 002 slice blocked on #48, then #50 |
| Chat | missing frontend surface | message actions/queries/schema and polling route | Participant scoped | blocked on audit #48, then #52 |
| Admin users | `usuarios.ts`, admin route | admin action/query/schema | ADMIN only | `to define`; #60 |

## Initial Gate Evidence

- T015: required contract template fields are defined.
- T016: public animal, detail, metrics, catalog, pagination allowlists and
  sensitive exclusions are defined from current query evidence.
- T017: protected DTO group allowlists and identity rules are defined.
- T018: exact auth proof methods/paths, DTO, exclusions, errors, backend sources,
  tests, and frontend dependency are defined.
- T019: same-origin reverse proxy is selected, current config gaps are recorded,
  and no provider-specific deployment behavior is claimed.
- T020-T022 and T024-T026: the credentials boundary and protected
  `GET /api/session` are implemented and validated by
  `__tests__/actions/auth-credentials.test.ts` and
  `__tests__/api/session.test.ts` (6 passing tests).

No seed, reset, migration, or real database operation was executed by Issue #21.
