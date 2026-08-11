# Quickstart: validação integrada e homologação da feature 006

Este roteiro é para a implementação futura. O planejamento não executa migration, seed, servidores
ou testes. Use somente ambiente local/homologação e as contas de teste autorizadas.

## 1. Preconditions

- Branch `006-perfis-publicos` atualizada sobre `main`.
- `.env` local configurado para banco de desenvolvimento/homologação, nunca produção.
- Portas 3000 e 8080 livres; `predev` deve falhar alto se houver processo órfão.
- Nenhum servidor dev ativo durante `npm run build`.
- Ler `spec.md`, `plan.md`, `research.md`, `data-model.md` e `contracts/http-contracts.md`.

Contas autorizadas (senha já documentada no harness do projeto):

- `adotante.aprovado@example.com`
- `adotante.pendente@example.com`
- `organizacao.teste@example.com`
- `organizacao.resende@example.com`
- `acolhedor.teste@example.com`
- `acolhedor.angra@example.com`
- `admin.teste@example.com`

## 2. Gate before applying data changes

```powershell
npm run prisma:validate
npx tsc --noEmit
npm test
npm --prefix frontend exec tsc -- --noEmit
npm --prefix frontend run build
```

Expected: all commands pass against the pre-feature baseline. If the frontend build changes
`routeTree.gen.ts` before new routes exist, discard only that generated change. Do not bulk-fix CRLF.

## 3. Onda 0 — schema and migration validation

Before applying:

1. Inspect `prisma/schema.prisma`: only planned fields/index are new.
2. Inspect generated migration SQL: no drop/reset; the backfill expression uses only `translate`,
   `lower`, whitespace compression and trim, and existing organizations receive a non-empty value
   before the column becomes required.
3. Confirm `normalizarNomeMunicipio()` is imported by registration, profile rename and seed; search
   for a second normalizer and reject it.

```powershell
npm run prisma:validate
npm run prisma:generate
npx tsc --noEmit
npm test -- __tests__/lib/municipios.test.ts
npx tsx scripts/verify-razao-social-normalizada.ts
```

Apply only to the authorized local/homologation database through the approved Prisma migration
command. Never run `migrate reset`, never edit an applied migration and never apply to production.

Data checks:

- every `Organizacao` has `razaoSocialNormalizada`;
- “Proteção  Animal” normalizes to `protecao animal`;
- a read-only verification over every organization reports zero differences between the persisted
  column and `normalizarNomeMunicipio(razaoSocial)`;
- nullable descriptions/images remain `null` without breaking reads.

## 4. Automated contract and privacy gate

```powershell
npx tsc --noEmit
npm test
npm --prefix frontend exec tsc -- --noEmit
npm --prefix frontend run build
```

Required focused suites (exact filenames may be finalized by `/speckit-tasks`):

```powershell
npm test -- __tests__/api/public-profiles.test.ts
npm test -- __tests__/api/adopter-profile-access.test.ts
npm test -- __tests__/api/organization-search.test.ts
npm test -- __tests__/api/public-animais.test.ts
npm test -- __tests__/actions/profile-image-upload.test.ts
```

Mutation check for CR-007 (review, not a committed mutation):

- remove/bypass the request-link predicate: adopter access suite must fail;
- remove the organization-only/active predicate from search: search suite must fail;
- add a forbidden field such as `telefone`, `cpf`, `cnpj` or coordinate to a DTO: privacy suites
  must fail.

If a suite remains green after its protection is removed, it does not satisfy CR-007.

## 5. Start the integrated stack

Terminal 1, repository root:

```powershell
npm run dev
```

Wait until `http://localhost:3000/api/animais` responds. Terminal 2:

```powershell
npm --prefix frontend run dev
```

Use `http://localhost:8080`. Do not accept silent port fallback; the port guard must stop startup.

## 6. API smoke matrix

### Public organization profile

1. Without a session, request a known active organization profile.
2. Confirm name, description/image fallback, municipality/UF, full institutional address and only
   its `DISPONIVEL` animals.
3. Apply species, sex, size and breed filters; breed control is absent if no catalog animal has a
   breed.
4. Confirm page size 30 and stable pagination.
5. Request inactive and nonexistent IDs: both must be identical 404 responses.
6. Search raw JSON for CPF, CNPJ, e-mail, telephone and coordinates: none may exist.

### Public foster profile

1. Confirm identity is exactly first name + last-name initial.
2. Confirm municipality/UF and own available catalog.
3. Inspect raw JSON: no full name, address, CEP, CPF, telephone, e-mail or coordinate.

### Animal DTO navigation

Inspect vitrine, detail, favorites and Feels:

- each responsible reference has `responsavelId` and `responsavelTipo`;
- organization links open `/organizacoes/{id}`;
- foster links open `/acolhedores/{id}`;
- no `Usuario.id` or ownership foreign-key field is exposed;
- Feels no longer links the responsible chip back to the same animal.

### Organization search

1. Search `protecao`, `PROTEÇÃO` and text with repeated spaces; results are equivalent.
2. One character, blank or spaces returns 400 and performs no broad query.
3. At most 10 active organizations appear, with only ID, name and municipality/UF.
4. No adopter or foster can appear, even with matching names.
5. Empty state points to the animal showcase.

### Adopter profile access matrix

Use the same target adopter for all rows and inspect the network response, not only rendered UI.

| Caller | Historical request link | Expected projection | Address/screening | Telephone |
|---|---:|---|---|---|
| Visitor | N/A | `PUBLIC` | absent | absent |
| Other adopter | N/A | `PUBLIC` | absent | absent |
| Organization | none | `PUBLIC` | absent | absent |
| Foster | none | `PUBLIC` | absent | absent |
| Organization/foster | `EM_ANALISE` | `RESTRICTED` | present | absent |
| Organization/foster | `APROVADA` | `RESTRICTED` | present | absent |
| Organization/foster | `RECUSADA` | `RESTRICTED` | present | absent |
| Organization/foster | `CONCLUIDA` | `RESTRICTED` | present | absent |
| Target adopter | own profile | `RESTRICTED` | present | absent |
| ADMIN | N/A | `RESTRICTED` | present | absent |

The adopter UI must explain who else can view the restricted data.

### Own profile maintenance and image

1. Organization and foster can save description up to 500 chars; 501 fails on client and server.
2. Clearing/whitespace description returns to the stable empty state.
3. Renaming an organization immediately changes accent-insensitive search behavior.
4. Upload one image ≤4 MB: profile updates after completion.
5. Non-image, >4 MB or multiple files fail.
6. Adopter, unauthenticated or inactive account cannot use `profileImage`.
7. Confirm request accepts no target profile ID and cannot update another account.

## 7. Responsive and accessibility homologation

Run public organization, search, adopter restricted view and foster profile at each target:

| Viewport | Zoom | Checks |
|---|---:|---|
| 375 px | 100% | no horizontal page scroll; filters and pagination operable |
| 1024 px | 100% | stable catalog grid; no clipped text/actions |
| 1440 px | 100% | readable line length and intentional density |
| desktop | 200% | no lost information or unreachable action |

For every flow:

- keyboard-only navigation, visible focus and logical order;
- headings/landmarks and accessible labels for search, filters and upload;
- loading skeleton does not cause destructive layout shift;
- distinct empty state for no animals versus no filter matches;
- filter chips/control state are identifiable and reversible without color alone;
- image fallback has useful accessible name; decorative images are ignored;
- semantic color tokens only, `page-canvas` at route root, no section-level canvas seams.

## 8. Seed and real-data exercise

Run the authorized test seed **before** opening browser sessions because it recreates users and logs
out existing sessions. Confirm it contains at least one accented organization name and descriptions.

After seed:

- verify normalized column values;
- verify the accented organization is found without accents;
- verify organizations/fosters remain distributed across municipalities;
- verify at least two photos per available animal remain intact.

## 9. Regression matrix

- Feature 003: public showcase/detail, auth session, registration, profile, favorites, requests,
  owner management and admin contracts still pass.
- Feature 004: navbar/shell, teal/amber tokens, Glass discipline, page canvas and generated route tree.
- Feature 005: `/feels`, favorite-on-like, session skip behavior, distance/city ordering, radius and
  no external geocoding call in reads.
- Verify frontend never imports Prisma or database credentials and all calls remain relative `/api/*`.

## 10. Final evidence record

Record for each scenario: date, commit, account role, URL, viewport, zoom, input/filter, expected,
actual, API status/shape and screenshot path where visual. Update `ENTREGA.md` per completed wave
with commit hash; without a hash, the wave remains open.
