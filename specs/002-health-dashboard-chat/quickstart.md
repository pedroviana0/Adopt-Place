# Quickstart: Health Operations Dashboard and Adoption Chat

## Prerequisites

- Node dependencies installed with `npm install`.
- Database configured through `DATABASE_URL`.
- Uploadthing environment configured as already required by the existing upload route.
- Branch `002-health-dashboard-chat` active.

## Seed Accounts

All demonstration accounts use password `test1234`.

| Role | Email | Demonstration data |
|------|-------|--------------------|
| ORGANIZACAO | `org@ciaanimal.com` | Overdue/today/future care, CONSULTA, active and archived chats |
| ORGANIZACAO | `org@spavr.com` | Positive disease test and private PDF metadata |
| ACOLHEDOR | `acolhedor@teste.com` | Independent-owner isolation |
| ADOTANTE | `adotante@teste.com` | Approved/completed requests and both seeded chats |
| ADMIN | `admin@adoptplace.com` | Existing admin dashboard; no chat access |

## Implementation Order

1. Add failing tests first for critical paths:
   - responsible-party isolation for health overview, agenda, documents, dashboard, and chat;
   - atomic planned-care completion for non-CONSULTA;
   - CONSULTA completion not creating health history;
   - approval creating exactly one conversation while preserving competing-request refusal;
   - adoption completion archiving conversation and blocking sends;
   - read/unread counters and mark-read behavior;
   - validation for dates, documents, and message text.
2. Update `prisma/schema.prisma` with additive enum values and new models from `data-model.md`.
3. Create Prisma migration and backfill planned care for existing health records with `dataProxima`.
4. Update Prisma seed with demonstration data:
   - overdue care;
   - care due today;
   - future care in 7 and 30 days;
   - CONSULTA agenda event;
   - positive disease test;
   - internal health document;
   - approved request with active chat;
   - completed adoption with archived chat.
5. Implement server schemas, actions, and queries.
6. Implement dashboard, health, documents, agenda, and chat UI using the contracts.
7. Verify public animal profile privacy.
8. Run quality gates.

## Manual Validation Scenarios

### Health Agenda

1. Log in as a responsible user with seeded animals.
2. Open `/dashboard/saude`.
3. Confirm overdue, today, next 7 days, next 30 days, animals without history, and positive tests are visible and scoped to the current responsible user.
4. Open `/dashboard/saude/agenda?situacao=ATRASADO` from the dashboard indicator.
5. Confirm the overdue item appears once.
6. Reagendar it and confirm the same item moves to the new date without duplicate rows.
7. Complete a non-CONSULTA item and confirm a completed `RegistroSaude` appears in the animal timeline and the pending item closes.
8. Complete a CONSULTA and confirm no CONSULTA appears in health history.

### Health Documents

1. Open `/dashboard/saude/documentos`.
2. Upload a valid image under 10 MB for an owned animal.
3. Upload a valid PDF under 10 MB for an owned animal.
4. Attempt invalid type and oversized file; confirm rejection and no metadata row.
5. Open the public animal page and confirm documents, document URLs, internal notes, clinic/professional fields, and agenda items are absent.
6. Delete a document with confirmation and confirm it disappears from the internal list.

### Operational Dashboard

1. Open `/dashboard` as ORGANIZACAO or ACOLHEDOR.
2. Click each indicator and confirm it opens the corresponding filtered list.
3. Create/update health, approve a request, and complete adoption.
4. Reload dashboard and confirm metrics reflect current data.
5. Log in as another responsible user and confirm no cross-owner metrics appear.
6. Check at 375 px viewport width.

### Adoption Chat

1. Approve an adoption request.
2. Confirm exactly one conversation appears for both the adopter and responsible user.
3. Confirm refused/in-analysis requests do not show chat.
4. Send text from both sides and verify chronological history and unread counts.
5. Open conversation and verify received visible messages become read.
6. Complete adoption and confirm history remains visible but send is blocked.
7. Attempt empty, over-2,000-character, archived, and unauthorized sends; confirm rejection.

## Commands

For a fresh database, apply the versioned migrations and seed before starting the
application:

```powershell
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000/login`. The implemented feature routes are:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/saude`
- `http://localhost:3000/dashboard/saude/agenda`
- `http://localhost:3000/dashboard/saude/documentos`
- `http://localhost:3000/dashboard/mensagens`

```powershell
npm run prisma:validate
npm run typecheck
npm run lint
npm test
npm run build
```

Only when authoring a new schema change after this feature, create another migration:

```powershell
npm run prisma:migrate -- --name <new-migration-name>
npm run prisma:generate
npm run prisma:seed
```

The seeded document URL is metadata-only and is not expected to download a real
file. Use a real Uploadthing upload for the open/download and provider-deletion
checks. Date fixtures are calculated from the application day at seed time, so run
the seed immediately before validating overdue/today groupings.

## Expected Gates

- Prisma schema validates.
- TypeScript strict passes.
- ESLint passes.
- Vitest passes, including test-first critical paths.
- Build passes.
- Manual quickstart privacy checks pass.
