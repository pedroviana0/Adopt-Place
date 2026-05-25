# Quickstart: Animal Adoption Management

## Prerequisites

- Node.js compatible with Next.js 15
- PostgreSQL 16 locally through Docker, or SQLite fallback through Prisma
  provider switching for developers without Docker
- Uploadthing application credentials

## Environment

Create `.env.local` with:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/adoptplace"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_SECRET="from-uploadthing-dashboard"
UPLOADTHING_APP_ID="from-uploadthing-dashboard"
```

SQLite fallback for local development:

```bash
DATABASE_URL="file:./dev.db"
```

## Bootstrap

```bash
npm install
npx prisma validate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Seed Expectations

Catalogs:

- Vaccines: V8, V10, Antirrábica, Gripe Felina, FeLV (vacina), Giárdia
- Diseases: FIV, FeLV, Leishmaniose, Erliquiose, Babesiose, Cinomose, Parvovirose
- Species/breeds: Cachorro, Gato, Coelho with the requested breeds

Users:

- `org@ciaanimal.com` / `test1234`
- `org@spavr.com` / `test1234`
- `acolhedor@teste.com` / `test1234`
- `adotante@teste.com` / `test1234`
- `adotante2@teste.com` / `test1234`
- `admin@adoptplace.com` / `test1234`

Data:

- 10 available animals: 4 Cia Animal VR, 4 SPA-VR, 2 foster
- 2 related sibling pairs
- At least one health record of each type
- 1 in-analysis adoption request
- 2 favorites for the screened adopter

## Acceptance Validation

1. Open `/` without login and confirm metrics plus public showcase.
2. Filter showcase by species, size, sex, city, and tags; confirm 12-item
   pagination and empty-state behavior.
3. Open `/animais/[id]` and confirm gallery, attributes, derived tags, health
   summary, related animals, and public responsible data only.
4. Click "Solicitar Adoção" and "Favoritar" as visitor and confirm login
   redirect with return destination.
5. Register an adopter and confirm redirect to `/dashboard/triagem`.
6. Try to request adoption before screening and confirm screening redirect.
7. Complete screening, request adoption, and confirm duplicate request is
   rejected.
8. Favorite and unfavorite an animal as adopter; confirm `/dashboard/favoritos`.
9. Login as organization/foster and create an animal with exactly one primary
   photo and optional ordered photos.
10. Create valid and invalid health records; confirm date and result validation.
11. Link two animals and confirm bidirectional related display; remove and
    confirm both directions disappear.
12. Approve an adoption request and confirm animal status
    `EM_PROCESSO_ADOCAO` and competing in-analysis requests become `RECUSADA`.
13. Refuse a request and confirm the animal remains `DISPONIVEL`.
14. Confirm organization/foster cannot see or manage another responsible party's
    requests, animals, health records, or adopters.
15. Confirm completed adoptions appear in `/dashboard/adotantes` for own animals
    only.
16. Login as admin, list users, deactivate a user, and confirm blocked access.
17. Test dashboard route without session and expired session behavior.
