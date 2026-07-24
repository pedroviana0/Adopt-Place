# HTTP Contract Inventory

This file is an inventory, not final endpoint implementation. Exact new paths must be defined in small backend Issues. Existing concrete backend HTTP routes at plan time are:

- `app/api/auth/[...nextauth]/route.ts`
- `app/api/mensagens/[id]/route.ts`
- `app/api/uploadthing/route.ts`

All additional contract groups below are required by the integration matrix but are not created by this plan.

| Contract Group | Frontend source today | Backend source of truth today | Auth mode | Status | Notes |
|----------------|-----------------------|-------------------------------|-----------|--------|-------|
| Session/login/logout | `frontend/src/lib/data/sessao.ts` | `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts` | NextAuth cookie session | Existing auth route; session DTO to define | First proof issue. Remove localStorage session only after real flow passes. |
| Public showcase | `animais.ts`, `catalogos.ts` | `lib/queries/animal-showcase.ts`, `public-metrics.ts`, `public-animal.ts`, `showcase.ts`, `tags.ts` | Public | To define | DTO must expose only public fields. |
| Public animal detail | `frontend/src/routes/animais.$animalId.tsx` | `lib/queries/public-animal.ts` | Public | To define | Must exclude private responsible/adopter/internal health data. |
| Registration | `usuarios.ts`, `cadastro.*.tsx` | `lib/actions/auth-register.ts`, `lib/schemas/adotante.ts` | Public mutation with validation | To define | Preserve e-mail/CPF/CNPJ uniqueness errors. |
| Profile and screening | `usuarios.ts`, profile/triagem routes | `lib/actions/triagem.ts`, auth/session, profile schema gaps to audit | Authenticated, role scoped | To define | CPF/CNPJ read-only; e-mail unique. |
| Favorites | `favoritos.ts` | `lib/actions/favoritos.ts`, `lib/queries/favorites.ts`, `lib/schemas/favorito.ts` | ADOTANTE only | To define | Must persist and survive storage clearing. |
| Adopter requests | `solicitacoes.ts` | `lib/actions/solicitacoes.ts`, `lib/queries/adopter-requests.ts`, `request-guards.ts` | ADOTANTE only | To define | Preserve screening and duplicate guards. |
| Owner request review | `solicitacoes.ts`, dashboard solicitacoes routes | `owner-requests.ts`, `owner-request-detail.ts`, `lib/actions/solicitacoes.ts` | ORGANIZACAO/ACOLHEDOR owner scoped | To define | Screening read-only only for own animal requests. |
| Animal management | `animais.ts` | `animais.ts`, `fotos.ts`, `animal-relacionado.ts`, `animal-search.ts`, `owned-animals.ts` | ORGANIZACAO/ACOLHEDOR owner scoped | To define | Include photos and bidirectional relationships. |
| Uploads | photo/profile/document flows | `lib/upload-router.ts`, `app/api/uploadthing/route.ts` | Owner scoped where protected | Existing route; flow contracts to define | Validate ownership and file type before metadata persistence. |
| Health records and agenda | `saude.ts` | `registro-saude.ts`, `cuidados-planejados.ts`, `health-dashboard.ts`, `procedure-alerts.ts` | ORGANIZACAO/ACOLHEDOR owner scoped | To define | CONSULTA never becomes clinical history. |
| Health documents | route/component gap to audit | `documentos-saude.ts`, `documento-saude.ts` | ORGANIZACAO/ACOLHEDOR owner scoped | To define | Documents are internal only. |
| Dashboards | dashboard routes | `adotante-dashboard.ts`, `operational-dashboard.ts`, `admin-users.ts` | Role scoped | To define | Metrics must be real and owner isolated. |
| Chat | route/component gap to audit | `mensagens.ts`, `app/api/mensagens/[id]/route.ts` | Participant scoped | Existing polling route; list/send/read contracts to define | Only after approval; archived read-only. |
| Admin users | `usuarios.ts`, admin route | `admin-users.ts`, `admin-user.ts` | ADMIN only | To define | Never expose password hash. |

## Required Contract Fields Per Future Issue

Each future backend Issue that defines a contract must document:

- Contract group and related matrix row.
- Final HTTP method and path.
- Auth mode and authorization checks.
- Request DTO schema and validation errors.
- Response DTO allowlist.
- Sensitive fields explicitly excluded.
- Backend source files used.
- Test cases for auth, ownership and critical transitions.
- Frontend Issue dependency and mock-removal condition.
