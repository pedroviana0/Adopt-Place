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

## Public Showcase Contracts (T037) — Issue #26

Public, unauthenticated GET contracts over the same-origin `/api/*` boundary.
No cookie/CSRF required. Responses are explicit allowlists; Prisma models are
never serialized directly. Executed by Arthur/Claude under explicit maintainer
authorization for this cycle.

### SHOWCASE-LIST-01 — `GET /api/animais` (`existing`, `app/api/animais/route.ts`)

- **Auth**: public. **Query**: `especieId`, `racaId`, `porte`, `sexo`, `cidade`,
  `tags` (`castrado|vacinado|vermifugado|testado`), `page`, parsed by
  `lib/schemas/showcase.ts` (`parseShowcaseFilters`); only `DISPONIVEL` animals.
- **200 DTO**: `{ animals: [{ id, nome, porte, sexo, idadeEstimada, castrado,
  status, fotoPrincipal, especie, raca, cidade, responsavel, tags[] }],
  pagination: { page, perPage, total, totalPages } }`.
- **Excluded**: responsible/adopter IDs, CNPJ/CPF, e-mail, phone, address,
  health detail, requests, favorites, documents, chat.
- **Backend**: `lib/queries/animal-showcase.ts`, `lib/tags.ts`.

### SHOWCASE-DETAIL-01 — `GET /api/animais/[id]` (`existing`, `app/api/animais/[id]/route.ts`)

- **Auth**: public. **200 DTO**: summary fields plus `cor`, `descricao`,
  `criadoEm`, ordered `fotos[{id,urlFoto,principal}]`, `resumoSaude[{id,tipo,
  dataRegistro}]`, `responsavel`, `cidade`, `tags[]`, and `relacionados[]`
  public summaries. **404** `NOT_FOUND` when the id does not exist.
- **Health decision (Issue #26)**: `resumoSaude` exposes only the category
  (`tipo`) and date. Granular clinical fields (`nomeDoenca`, `resultado`,
  `medicamentoTratamento`, `procedimento`, `nomeVacina`, `tipoMedicamento`,
  `frequencia`, `titulo`, `dataProxima`) are **not selected** by
  `lib/queries/public-animal.ts` — private diagnoses/results never leave the DB.
- **Excluded**: `observacoes`, `profissionalClinica`, `localProfissional`,
  responsible/adopter IDs and contacts, screening, documents, chat.

### METRICS-01 — `GET /api/metrics` (`existing`, `app/api/metrics/route.ts`)

- **Auth**: public. **200 DTO**: `{ availableAnimals, completedAdoptions,
  responsibleParties }` (aggregate counts only). **Backend**:
  `lib/queries/public-metrics.ts`.

### CATALOG-01 — `GET /api/catalogos` (`existing`, `app/api/catalogos/route.ts`)

- **Auth**: public. **200 DTO**: `{ especies: [{ id, nome, racas: [{ id, nome,
  especieId }] }], cidades: string[] }` (cities that currently have available
  animals). **Backend**: `lib/queries/animal-showcase.ts`
  (`getShowcaseFilterOptions`). Vaccine/disease catalogs remain out of scope.

- **Tests**: `__tests__/api/public-animais.test.ts` (DTO shape, tag presence,
  404, sensitive/clinical-field exclusion) and the tightened
  `__tests__/queries/public-animal.test.ts` (health summary only).
- **Frontend dependency**: Issue #27 (T040-T042) consumes these in
  `frontend/src/lib/data/animais.ts` and `catalogos.ts`; mock removal only after
  the flow is validated. Matrix SHOWCASE-01 rows move to `contract defined` and,
  with the implementation and passing tests, to `backend ready`.

## Registration, Profile and Screening Contracts (T047) — Issue #29

All application-owned contracts below use JSON, reject unknown fields, return
explicit DTO allowlists, and use the same-origin `/api/*` boundary. The frontend
maps its current `senha` form field to the contract field `password`; passwords
and hashes never appear in responses.

### REGISTRATION-01 — `POST /api/cadastro/[tipo]` (`backend ready`)

- **Auth mode**: public validated mutation. `tipo` is exactly `adotante`,
  `organizacao`, or `acolhedor`.
- **Request DTO**: common `email` and `password`, plus only the profile fields
  proven by `prisma/schema.prisma`: adopter `nomeCompleto`, `cpf`, `telefone`,
  optional `instagram`, `endereco`, `cidade`, `estado`; organization
  `razaoSocial`, `cnpj`, `telefone`, `endereco`, `cidade`, `estado`,
  `responsavelNome`, optional `capacidadeMaxima`; foster `nomeCompleto`, `cpf`,
  `telefone`, `endereco`, `cidade`, `estado`.
- **201 response DTO**:
  `{ user: { id, email, tipoPerfil, ativo, profileId } }`.
- **Errors**: 400 `VALIDATION_ERROR`; 404 `REGISTRATION_TYPE_NOT_FOUND`; 409
  `EMAIL_ALREADY_EXISTS`, `CPF_ALREADY_EXISTS`, or `CNPJ_ALREADY_EXISTS`.
  Conflicts do not reveal any field beyond the submitted unique identifier.
- **Backend source**: `lib/actions/auth-register.ts`,
  `lib/schemas/adotante.ts`, `lib/schemas/perfil.ts`, bcrypt, and nested Prisma
  profile creation. Registration does not invent automatic login; Issue #30 may
  call the already-proven NextAuth login after a 201 response.
- **Explicit exclusions**: `senhaHash`, password, cookie/token, complete Prisma
  records, screening, address or identifier fields beyond the newly-created
  caller's response (which contains no CPF/CNPJ/address).

### PROFILE-01 — `GET /api/perfil` and `PATCH /api/perfil` (`backend ready`)

- **Auth mode**: authenticated, active account, own role/profile only. Identity
  and profile ID come from the current NextAuth session and current `Usuario`
  row, never from request data.
- **GET response DTO**: `{ profile: { tipoPerfil, email, ...roleFields } }`.
  Adopter fields are `id`, `nomeCompleto`, read-only `cpf`, `telefone`,
  `instagram`, `endereco`, `cidade`, `estado`; organization fields are `id`,
  `razaoSocial`, read-only `cnpj`, `telefone`, `endereco`, `cidade`, `estado`,
  `responsavelNome`, `capacidadeMaxima`; foster fields are `id`,
  `nomeCompleto`, read-only `cpf`, `telefone`, `endereco`, `cidade`, `estado`,
  `capacidadeAtual`.
- **PATCH request DTO**: partial role-specific editable fields above plus
  optional unique `email`. `cpf`, `cnpj`, `tipoPerfil`, profile/user IDs,
  `ativo`, and unknown fields are rejected with 400 before any write.
- **PATCH response DTO**: the same allowlisted own-profile DTO as GET.
- **Errors**: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403
  `INACTIVE_ACCOUNT` or `ROLE_NOT_SUPPORTED`; 404 `PROFILE_NOT_FOUND`; 409
  `EMAIL_ALREADY_EXISTS`.
- **Backend source**: current `Usuario` plus its role relation, role-specific
  schemas in `lib/schemas/perfil.ts`, and one nested `Usuario.update` so e-mail
  and profile changes are atomic.
- **Explicit exclusions**: password/hash, another profile, screening answers,
  requests, health, documents, chat, and `fotoUrl`. Organization/foster
  `fotoUrl` remains a product decision and schema gap, not a contract field.

### SCREENING-01 — `GET /api/triagem` and `PUT /api/triagem` (`backend ready`)

- **Auth mode**: authenticated active `ADOTANTE`, own screening only.
- **GET response DTO**: `{ screening: { ...screeningFields,
  triagemConcluida } }`, selected only from the adopter profile derived from the
  session.
- **PUT request DTO**: the complete `adopterScreeningSchema` fields. Browser
  supplied `usuarioId` or `adotanteId` and all unknown fields are rejected.
- **PUT response DTO**: the same allowlisted screening DTO with
  `triagemConcluida: true`.
- **Errors**: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403
  `INACTIVE_ACCOUNT` or `ADOPTER_ONLY`; 404 `PROFILE_NOT_FOUND`.
- **Backend source**: `lib/actions/triagem.ts`,
  `lib/schemas/adotante.ts`, `lib/actions/request-guards.ts`, and the current
  adopter relation. The existing request guard remains authoritative:
  incomplete screening blocks adoption requests.
- **Privacy**: screening never appears in public/profile/session DTOs and is not
  available to organization, foster, admin, or another adopter through this
  self-service contract. A later owner-request contract must define a separate
  read-only allowlist.
- **Tests**: `__tests__/api/profile-screening.test.ts`,
  `__tests__/api/registration.test.ts`, and the screening-required tests in
  `__tests__/actions/solicitacoes.test.ts`.
- **Frontend dependency**: Issue #30 may consume these contracts only after
  Issue #29 marks REG-01, PROFILE-01, and SCREEN-01 `backend ready`; mock removal
  remains frontend-owned and per-flow.

## Adopter Journey Contracts (T055) — Issue #32

All contracts below use the same-origin `/api/*` boundary and the secure
NextAuth cookie. They revalidate the current `Usuario.ativo`, role and adopter
relation before any protected read or write. `usuarioId` and `adotanteId` never
come from the browser. Application JSON mutations do not use the NextAuth CSRF
endpoint; they depend on the documented same-origin/proxy boundary, credentialed
cookies, `SameSite=Lax`, JSON content type and no credentialed cross-origin CORS.

### FAVORITES-01 — `GET /api/favoritos` (`backend ready`)

- **Auth mode**: authenticated active `ADOTANTE`.
- **200 response DTO**:
  `{ favorites: [{ animalId, criadoEm, animal: { id, nome, status,
  idadeEstimada, especie, raca, porte, sexo, castrado, fotoPrincipal,
  responsavel, cidade, tags[] } }] }`.
- **Selection rule**: only favorites belonging to the session adopter and only
  currently available animals, ordered by newest favorite.
- **Explicit exclusions**: adopter/user IDs, another adopter's favorites,
  responsible IDs and contacts, CPF/CNPJ, address, raw health records,
  screening, requests, documents and chat.

### FAVORITE-STATE-01 — `PUT|DELETE /api/favoritos/[animalId]` (`backend ready`)

- **Auth mode**: authenticated active `ADOTANTE`.
- **Path**: `animalId` validated by `toggleFavoriteSchema`; no body.
- **PUT**: idempotently creates the composite favorite for the session adopter
  when the animal exists and is `DISPONIVEL`.
- **DELETE**: idempotently removes only the session adopter's composite
  favorite, including when the animal later became unavailable.
- **200 response DTO**: `{ favorite: { animalId, favorited } }`.
- **Errors**: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403
  `INACTIVE_ACCOUNT` or `ADOPTER_ONLY`; 404 `ANIMAL_NOT_AVAILABLE`.

### ADOPTER-REQUESTS-01 — `GET|POST /api/solicitacoes` (`backend ready`)

- **Auth mode**: authenticated active `ADOTANTE`.
- **GET response DTO**:
  `{ requests: [{ id, status, dataSolicitacao, dataAtualizacao, observacoes,
  animal: { id, nome, fotoPrincipal, responsavel } }] }`, newest first.
- **POST request DTO**: strict JSON `{ animalId }` validated by
  `adoptionRequestSchema`; browser-supplied adopter/user IDs and unknown fields
  are rejected before reads or writes.
- **POST 201 response DTO**: `{ request: AdoptionRequestDTO }`.
- **Business rules**: completed screening is required; the animal must be
  `DISPONIVEL`; an existing active request (`EM_ANALISE` or `APROVADA`) for the
  same adopter/animal is rejected. The Prisma composite uniqueness remains the
  storage source of truth and is not changed by this Issue.
- **Errors**: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403
  `INACTIVE_ACCOUNT` or `ADOPTER_ONLY`; 409 `SCREENING_REQUIRED`,
  `ANIMAL_UNAVAILABLE`, `ACTIVE_REQUEST_EXISTS`, or
  `REQUEST_ALREADY_EXISTS`.
- **Explicit exclusions**: `adotanteId`, user/profile IDs, screening answers,
  another adopter's requests, owner contacts, private animal/health fields,
  documents and chat.

### ADOPTER-DASHBOARD-01 — `GET /api/dashboard/adotante` (`backend ready`)

- **Auth mode**: authenticated active `ADOTANTE`.
- **200 response DTO**:
  `{ dashboard: { id, nomeCompleto, triagemConcluida } }`.
- **Purpose**: expose only the existing adopter dashboard query's proven
  screening status. Favorites and requests remain in their own contracts;
  aggregate metrics are not invented.
- **Errors**: 401 `UNAUTHENTICATED`; 403 `INACTIVE_ACCOUNT` or
  `ADOPTER_ONLY`; 404 `PROFILE_NOT_FOUND`.
- **Explicit exclusions**: screening answers, CPF/contact/address, requests,
  favorites, health, documents and chat.

- **Backend sources**: `lib/actions/favoritos.ts`,
  `lib/actions/solicitacoes.ts`, `lib/actions/request-guards.ts`,
  `lib/queries/favorites.ts`, `lib/queries/adopter-requests.ts`,
  `lib/queries/adotante-dashboard.ts`, `lib/schemas/favorito.ts`,
  `lib/schemas/solicitacao.ts`, and the route handlers above.
- **Tests**: `__tests__/api/adopter-journey.test.ts` plus the existing
  request-guard tests in `__tests__/actions/solicitacoes.test.ts`.
- **Issue #32 validation**: 23 focused tests passed for session-derived
  identity, active-account and role checks, ownership, favorite idempotency,
  completed-screening, availability and duplicate-request guards. Typecheck,
  targeted lint and the production backend build passed. An isolated
  PostgreSQL 16 round trip returned 401 without a session, persisted one
  favorite, created one request with 201, rejected its active duplicate with
  409, returned only the current adopter's data, exposed the narrow dashboard
  DTO and removed the favorite idempotently. No seed, reset or migration was
  run against the original database.
- **Frontend dependency**: Issue #33 may replace
  `frontend/src/lib/data/favoritos.ts`, adopter-owned functions in
  `solicitacoes.ts`, and affected routes only after Issue #32 marks these
  contracts `backend ready`.

## Owner Animal Management Contracts (T064) - Issues #35-#39

All contracts in this group require an authenticated, currently active
`ORGANIZACAO` or `ACOLHEDOR`. The backend reloads the account and scoped
responsible profile from `Usuario` before protected data access. Browser payloads
never choose `organizacaoId`, `acolhedorId` or another ownership identifier.

### OWNER-ANIMALS-01 - `GET|POST /api/animais/gerenciados`

- **GET filters**: optional `q`, `status`, `especieId`, `racaId`, `porte` and
  `sexo`, validated by `ownedAnimalFilterSchema`. Every filter is combined with
  the responsible identity derived from the current account.
- **GET response**: `{ animals: OwnedAnimalSummaryDTO[] }`, ordered by animal
  name. Each item allows only `id`, management attributes, taxonomy names,
  primary photo and pending-request count. Owner IDs and private related
  entities are excluded.
- **POST request**: strict `AnimalInputDTO` with `nome`, `especieId`, nullable
  `racaId`, `porte`, `sexo`, `cor`, nullable `idadeEstimada`, `castrado`,
  nullable `descricao` and `status`.
- **POST behavior**: creates exactly one owner relation from the active account;
  owner IDs and unknown fields are rejected.
- **POST response**: `201 { animal: { id } }`. The frontend uses the returned
  identifier to navigate to the protected detail contract.

### OWNER-ANIMAL-01 - `GET|PATCH|DELETE /api/animais/gerenciados/[id]`

- **Path**: CUID validated before the operation.
- **GET response**: `{ animal: OwnedAnimalDetailDTO }` with the allowed
  management fields, taxonomy and ordered photos.
- **PATCH request**: the same strict editable animal fields as creation. Owner
  transfer is not part of this contract.
- **DELETE behavior**: deletes only an owned animal. A database relation that
  prevents deletion is returned as `409 ANIMAL_HAS_DEPENDENCIES`; no cascade is
  invented.
- **Errors**: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403
  `INACTIVE_ACCOUNT`, `RESPONSIBLE_ONLY` or `FORBIDDEN`; 404
  `ANIMAL_NOT_FOUND`; 409 `ANIMAL_HAS_DEPENDENCIES`.

### OWNER-ANIMAL-PHOTOS-01

- **Read**: ordered photos are included in `OwnedAnimalDetailDTO`.
- **Upload transport**: existing `POST /api/uploadthing`, endpoint
  `animalPhoto`, input `{ animalId }`, image only, at most 4 MB per file and at
  most 10 files. The official frontend sends one selected file per interaction.
  Middleware and upload completion both recheck the active responsible account,
  role and current ownership.
- **Upload completion**: stores the first photo as primary with order zero;
  later photos append after the current maximum order. The serializable write
  prevents concurrent completions from assigning two primary photos. Server data
  returns only `{ photo: { id, animalId, principal, ordem } }`; the frontend must
  not synthesize successful persistence from provider file metadata.
- **Order**: `PATCH /api/animais/gerenciados/[id]/fotos` with strict
  `{ photos: [{ id, ordem }] }`. The payload must contain every current photo
  exactly once with unique contiguous positions.
- **Primary**:
  `PUT /api/animais/gerenciados/[id]/fotos/[fotoId]` atomically clears the old
  primary and selects the owned target photo.
- **Delete**:
  `DELETE /api/animais/gerenciados/[id]/fotos/[fotoId]` accepts optional strict
  JSON `{ novaPrincipalId }`. The only photo cannot be removed; deleting the
  primary requires another owned photo as replacement.
- **Known integration constraint**: Uploadthing requires an existing `animalId`.
  The frontend creates the animal before upload and reports success only after a
  fresh protected animal read confirms a primary photo. If upload or confirmation
  fails, the animal remains persisted and the same form retries against its
  existing ID instead of creating a duplicate. No staging model or migration is
  introduced.
- **Provider configuration**: Uploadthing 7.7.4 reads `UPLOADTHING_TOKEN` only in
  the backend service. The variable is documented in `.env.example` without a
  real credential and is never exposed to `frontend/`.

### OWNER-ANIMAL-RELATIONSHIPS-01

- **List**:
  `GET /api/animais/gerenciados/[id]/relacionamentos` returns
  `{ relationships: OwnedAnimalRelationshipDTO[] }` for an owned source animal.
- **Link**:
  `POST /api/animais/gerenciados/[id]/relacionamentos` with strict
  `{ animalRelacionadoId }`.
- **Unlink**:
  `DELETE /api/animais/gerenciados/[id]/relacionamentos/[relatedId]`.
- **Rules**: both animals must belong to the current responsible account;
  self-link is rejected; link and unlink write both directions in one
  transaction and are idempotent.

### Validation and privacy

- Tests must prove no session, inactive account, wrong role, ownership
  isolation, exactly-one derived owner, no owner transfer, photo ordering and
  primary behavior, upload ownership, self-link rejection, bidirectional
  relationship effects and owner-scoped filters.
- Responses exclude owner IDs, `Usuario`, CPF/CNPJ, contacts, addresses,
  requests, adopters, screening, private health fields, documents and chat.
- Sources are the existing Prisma `Animal`, `FotoAnimal`,
  `AnimalRelacionado`, `Especie` and `Raca` models plus
  `lib/actions/animais.ts`, `fotos.ts`, `animal-relacionado.ts`,
  `animal-search.ts`, `lib/queries/owned-animals.ts`, the three animal schemas
  and `lib/upload-router.ts`.
- No Prisma model, enum, migration or dependency is added by these contracts.

## Owner Request and Basic Health Contracts (T076) - Issues #43/#44

Every contract in this section requires a currently active `ORGANIZACAO` or
`ACOLHEDOR`. The backend reloads the account and responsible profile before any
protected read or write. Browser-provided user, organization, foster or animal
owner IDs are never accepted.

### REQUEST-OWNER-01 - responsible request review

- `GET /api/solicitacoes/gerenciadas` accepts only an optional validated
  `status` filter. It returns `{ requests: OwnerRequestSummaryDTO[] }`, newest
  first, and combines the filter with ownership of the requested animal.
- `GET /api/solicitacoes/gerenciadas/[id]` applies request ID and animal
  ownership in the same query that selects screening data. It returns
  `{ request: OwnerRequestDetailDTO }` with request dates/status/notes, animal
  `id`/`nome`, and a read-only screening allowlist.
- The screening allowlist contains the fields rendered by
  `TriagemReadOnly.tsx`, including name, telephone, city/state, housing,
  routine, history and commitments. It excludes CPF, street address,
  Instagram, user/profile ownership IDs, password data and unrelated records.
- `PATCH /api/solicitacoes/gerenciadas/[id]` accepts strict
  `{ decision: "APROVADA" | "RECUSADA", observacoes? }`. Only
  `EM_ANALISE` can transition. Approval atomically changes the request and
  available animal, refuses competing requests, and creates the participant
  conversation. Refusal changes only the selected request.
- `POST /api/solicitacoes/gerenciadas/[id]` completes an approved request.
  It atomically changes the request to `CONCLUIDA`, the animal to `ADOTADO`,
  and the conversation to archived/read-only.
- Conditional writes repeat the expected previous status inside the
  transaction. Concurrent or repeated transitions return
  `409 INVALID_TRANSITION`.

### HEALTH-BASIC-01 - completed clinical history

- `GET|POST /api/animais/gerenciados/[id]/saude` lists newest-first owned
  records or creates one record for an owned animal.
- `PATCH|DELETE
  /api/animais/gerenciados/[id]/saude/[registroId]` requires both the animal
  path and record path to match the current owner's data.
- Request bodies are strict JSON and use ISO 8601 date strings. They support
  only the five Prisma history categories: `VACINA`, `CONTROLE_PARASITAS`,
  `TESTE_DOENCA`, `MEDICAMENTO_TRATAMENTO`, and `PROCEDIMENTO`.
- `CONSULTA` is rejected and is never stored as a clinical-history fact.
  Application dates cannot be future dates, and a next date must be later than
  the application date.
- Responses use `HealthRecordDTO`; dates are serialized as ISO strings and only
  the protected responsible flow receives clinical fields. These fields remain
  excluded from public animal endpoints.
- Create/update synchronize at most one pending `CuidadoPlanejado` derived from
  the next date. Clearing the date or deleting the record removes the pending
  derived care in the same transaction.
- `GET /api/saude/alertas` returns the current owner's vaccine, parasite-control
  and procedure records due in the next 30 days as
  `{ alerts: UpcomingHealthAlertDTO[] }`.

### Shared errors and evidence

- Stable errors are 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403
  `INACTIVE_ACCOUNT`/`FORBIDDEN`, 404 `NOT_FOUND`, and 409
  `INVALID_TRANSITION`.
- Evidence lives in `__tests__/api/owner-requests.test.ts`,
  `__tests__/api/owner-health.test.ts`,
  `__tests__/queries/owner-requests.test.ts`,
  `__tests__/actions/solicitacoes.test.ts`, and
  `__tests__/actions/registro-saude.test.ts`.
- No Prisma model, enum, migration, seed or database reset is added by these
  contracts. Frontend consumption remains assigned to Issues #45 and #46.

## Feature 002 Health Center Contract (T087) — Issue #49

`HEALTH-CENTER-01`. Every endpoint requires a currently active `ORGANIZACAO` or
`ACOLHEDOR` and is scoped to that owner's animals; the route rejects an
unauthenticated, inactive, or non-responsible caller before any read or write.
This contract is a thin HTTP exposure of the existing, already-tested planned-care
Server Actions (`lib/actions/cuidados-planejados.ts`) and health query
(`lib/queries/health-dashboard.ts`); it adds no new behavior. Dates are ISO 8601.

### HEALTH-CENTER-01 — planned care and health overview

- `GET /api/saude/visao-geral` returns `{ overview }` with overdue / today /
  next-7-day / next-30-day planned-care groups, animals without history, and
  positive-test animals, all owner-scoped (`getHealthOverview`).
- `GET /api/saude/agenda` accepts the validated agenda filters `animalId`,
  `tipo`, `situacao`, `from`, `to` and returns `{ items }` newest-relevant-first
  (`getHealthAgenda`). Invalid filters return `400 VALIDATION_ERROR`.
- `POST /api/saude/cuidados` creates a manual future `CONSULTA` from strict
  `{ animalId, dataHoraPlanejada, titulo, observacoes?, localProfissional? }`.
  A `CONSULTA` is an agenda-only event and never becomes health history.
- `POST /api/saude/cuidados/[id]/concluir` completes the planned care. For a
  `CONSULTA` the body is empty and no `RegistroSaude` is created; for the five
  history categories the body is the strict ISO health record, and the existing
  action persists the matching record plus at most one derived next care.
  Completion is idempotent: a second attempt returns `409`.
- `PATCH /api/saude/cuidados/[id]` reschedules the single planned occurrence
  (`{ dataHoraPlanejada }`, must be future). `DELETE /api/saude/cuidados/[id]`
  cancels/discards it and requires `{ confirmado: true }`; completed history is
  preserved.
- Stable errors: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403
  `INACTIVE_ACCOUNT`/`FORBIDDEN`, 404 `NOT_FOUND`, 409 (already concluded/
  cancelled). Ownership and the `CONSULTA`-not-history and idempotency rules are
  enforced by the underlying action, not re-implemented in the route.
- Evidence: `__tests__/api/health-center.test.ts` (auth, CONSULTA-not-history,
  idempotency 409, owner-scoped overview), plus the existing
  `__tests__/actions/cuidados-planejados.test.ts` and
  `__tests__/queries/health-dashboard.test.ts`. No Prisma model, enum, migration,
  seed, or database reset is added. Frontend consumption remains Issue #55.

## Feature 002 Dashboard, Document and Chat Contracts (T088-T090) - Issues #50-#52

All protected endpoints below reload the current `Usuario` before accessing
private data. Session claims do not decide whether an account is active or which
responsible profile currently owns an animal. No endpoint accepts a user,
organization, foster or participant ID from the browser.

### OPERATIONAL-DASHBOARD-01

- `GET /api/dashboard/operacional` requires an active `ORGANIZACAO` or
  `ACOLHEDOR` and returns `{ dashboard }` from
  `getOperationalDashboard(reference, responsibleContext)`.
- The DTO contains only owner-scoped indicators, priority items, adoption
  funnel, animal-status counts, recent activity and unread-message count. It
  excludes raw rows, owner IDs, contacts, screening, document URLs and message
  contents.
- Evidence: `__tests__/api/operational-dashboard.test.ts` and
  `__tests__/queries/operational-dashboard.test.ts` prove 401/403 handling and
  organization/foster ownership predicates on every aggregate source.

### HEALTH-DOCUMENTS-01

- `GET /api/saude/documentos` accepts optional validated `animalId` and `tipo`
  filters and returns `{ documents }`, newest first, only for animals owned by
  the current responsible profile.
- `GET /api/saude/documentos/[id]` returns `{ document }` only after combining
  the document ID and current ownership in the read; another owner's document
  is indistinguishable from a missing document.
- `DELETE /api/saude/documentos/[id]` deletes only owned metadata. UploadThing
  file cleanup remains best-effort and never deletes a health-history record.
- Upload continues through `POST /api/uploadthing`, endpoint
  `healthDocument`, with strict `animalId`, optional matching
  `registroSaudeId`, `tipoDocumento`, one image/PDF and the existing 10 MB
  application limit. Authorization reloads the current account and ownership;
  each provider upload receives a unique custom ID.
- The protected DTO allowlists document/animal/optional-record display fields
  and `openHref`. Provider key `chaveArquivo`, owner IDs and document data from
  other owners are excluded. Documents remain absent from every public DTO.
- Evidence: `__tests__/api/health-documents.test.ts`,
  `__tests__/actions/documentos-saude.test.ts`,
  `__tests__/actions/documento-upload.test.ts` and document query tests.

### ADOPTION-CHAT-01

- `GET /api/conversas?status=ativas|arquivadas|todas` returns
  `{ conversations, unreadCount }` for the current active participant.
- `GET /api/conversas/[id]` returns `{ conversation }` only to a participant.
  `POST /api/conversas/[id]/mensagens` accepts strict `{ texto }` and sends only
  while the conversation is `ATIVA`. `PATCH /api/conversas/[id]/leitura`
  updates only the current participant's read marker.
- `GET /api/mensagens/[id]?after=<ISO-8601>` remains the polling contract and
  returns `{ messages: [{ id, text, sentAt, authorIsMe }], status }`. It no
  longer exposes `autorUsuarioId`.
- Conversations are created only by the existing transactional request
  approval and archived by adoption completion. Therefore requests in analysis
  or refused states have no chat; archived history remains readable but sends
  return `409 CONVERSATION_ARCHIVED`. `ADMIN` has no implicit access.
- Evidence: `__tests__/api/chat.test.ts`,
  `__tests__/queries/mensagens-polling.test.ts`, existing message action/query
  tests and `__tests__/actions/health-chat-dashboard-flow.test.ts`.

Shared errors are 400 `VALIDATION_ERROR`/`INVALID_JSON`, 401
`UNAUTHENTICATED`, 403 `INACTIVE_ACCOUNT`/`FORBIDDEN`, 404 `NOT_FOUND`, and 409
`CONVERSATION_ARCHIVED`. These contracts add no Prisma model, enum, migration,
seed or database reset. Frontend consumption remains Issues #54-#58.

## Remaining Contract Groups

| Contract group | Frontend source today | Backend source of truth today | Auth mode | Status / next owner |
|----------------|-----------------------|-------------------------------|-----------|---------------------|
| Session/login/logout | `frontend/src/lib/data/sessao.ts` | `lib/auth.ts`, `lib/auth-credentials.ts`, auth routes, auth guards/permissions | NextAuth cookie + protected session DTO | `backend ready`; frontend #22 |
| Public showcase/detail/metrics/catalogs | `animais.ts`, `catalogos.ts`, public routes | public animal/showcase/metrics queries, showcase schema, tags | Public | `flow complete`; #26-#28 |
| Registration | `usuarios.ts`, `cadastro.*.tsx` | registration actions and role-specific schemas | Public validated mutation | `flow complete`; #29-#31 |
| Profile and screening | `usuarios.ts`, profile/triagem routes | profile/triagem handlers and schemas, auth/session | Authenticated, role scoped | `flow complete`; #29-#31; photo decision remains blocked |
| Favorites | `favoritos.ts` | favorite action/query/schema and documented handlers | ADOTANTE only | `backend ready`; #32; frontend #33 |
| Adopter requests and dashboard | `solicitacoes.ts`, adopter routes | request actions/guards/queries/schemas and documented handlers | ADOTANTE only | `backend ready`; #32; frontend #33 |
| Owner request review | `solicitacoes.ts`, owner request routes | owner request queries/action/decision schema | ORGANIZACAO/ACOLHEDOR owner scoped | `backend ready`; #43 |
| Animal management | `animais.ts`, owner animal routes | animal/photo/relationship/search actions, owner query, schemas and documented handlers | ORGANIZACAO/ACOLHEDOR owner scoped | `flow complete`; #35-#42 |
| Uploads | `frontend/src/lib/upload.ts` and future document UI | upload router and Uploadthing route | Owner scoped where protected | animal photo contract defined in #35; health document backend ready in #51 |
| Feature 001 health | `saude.ts` | health action, alerts query, schema | ORGANIZACAO/ACOLHEDOR owner scoped | `backend ready`; #44 |
| Feature 002 health center | incomplete frontend surface | planned-care action/query/schema + `HEALTH-CENTER-01` routes | Owner scoped | `backend ready`; #49 (T087/T091); frontend #55 |
| Health documents | missing frontend surface | document action/query/schema/upload + `HEALTH-DOCUMENTS-01` routes | Owner scoped and private | `backend ready`; #51; frontend #54/#57 |
| Dashboards | dashboard routes | adopter/operational/admin queries + `OPERATIONAL-DASHBOARD-01` route | Role and owner scoped | feature 002 operational slice `backend ready`; #50; frontend #54/#56 |
| Chat | missing frontend surface | message actions/queries/schema + `ADOPTION-CHAT-01` routes | Participant scoped | `backend ready`; #52; frontend #54/#58 |
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
