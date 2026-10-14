# Entrega — Spec 009: Lar temporário e reforma do status

| | |
|---|---|
| **Período** | 2026-10-14 → — |
| **Branch** | `009-lar-temporario-status` |
| **PRs** | — |
| **Status** | EM ANDAMENTO |
| **Spec** | [`spec.md`](spec.md) |

Execução: Pedro, sozinho, com acordo do Arthur (mantenedor) registrado em 2026-10-14.

## 1. O que a spec promete

| Fase | Conteúdo | Estado |
|---|---|---|
| 1 | Migration e remoção de `RESGATADO` | Código pronto (`fd8f99c`); falta T001 e o `migrate deploy` no `dev-009` (T007) |
| 2 | Backend (regra de LT, API de LT, tratamento, dashboard) | Não iniciada |
| 3 | Frontend | Não iniciada |
| 4 | Testes, seed e homologação | Não iniciada |
| 5 | Documentação, PR e virada | Não iniciada |

## 2. O que foi entregue

### Fase 1 — migration e remoção de `RESGATADO` (commit `fd8f99c`)

- `prisma/schema.prisma`: `StatusAnimal` sem `RESGATADO`, `@default(EM_CUIDADOS)`; enum `SituacaoLT`;
  `Animal.situacaoLT`, `Animal.larTemporarioId` (FK `SET NULL`); model `LarTemporario` (FK
  `CASCADE` para `Organizacao`).
- `prisma/migrations/20261014180000_status_sem_resgatado/migration.sql`: gerada por
  `prisma migrate diff`, mais o `UPDATE … 'RESGATADO' → 'EM_CUIDADOS'` escrito à mão logo depois do
  `BEGIN;`.
- `prisma/migrations/20261014180100_lar_temporario/migration.sql`: gerada sem edição.
- `scripts/verify-009-migration.ts`: verificador read-only das invariantes I1–I4.
- Backend (`statusInitial`), frontend (`enums.ts`, `schemas/animal.ts`, `StatusBadge.tsx`) e
  fixtures de 3 arquivos de teste sem `RESGATADO`.

**Validação (2026-10-14, worktree sem `.env`, logo sem acesso a banco nenhum):**
- `prisma validate` OK (com URL fictícia de localhost, só para satisfazer a variável);
- `prisma generate` OK;
- `tsc` OK no backend e no frontend;
- build do frontend OK; `routeTree.gen.ts` inalterado;
- `git grep RESGATADO` (fora de `legacy/`, `specs/`, migrations e `contextospecs_v2.md`) vazio;
- `npm test`: **366/367**. A falha é `__tests__/seed/organization-search-seed.test.ts`, que precisa de
  `DATABASE_URL` real; é só leitura e não depende desta mudança. Deve passar com o `.env` no
  `dev-009` (T001).

**Pendente na Fase 1:** T001 (criar o `dev-009` e apontar o `.env`) e o `migrate deploy` no
`dev-009` (T007), ambos do Pedro.

## 3. Decisões que não se reabrem

- As migrations foram geradas contra `HEAD:prisma/schema.prisma`, **não** contra `main:`. A `main`
  local deste repositório (`58a8856`) está atrás da base da branch (`95f54d1`), e um diff contra ela
  sairia errado. Quem regerar migration nesta base deve conferir `git rev-parse main` antes.
- Nos testes, as fixtures `RESGATADO` que testavam uma **transição** viraram outro status de origem
  (`DISPONIVEL → EM_CUIDADOS` e `EM_PROCESSO_ADOCAO → EM_CUIDADOS`), para não virar transição nula. No
  `owner-animals.test.ts`, a troca para `EM_CUIDADOS` garante que o 400 continue vindo do
  `organizacaoId` recusado, e não de um status inválido.

## 4. O que a spec previa e não foi entregue

—

## 5. Armadilhas descobertas

- **`npm test` lê o banco do `.env`.** `organization-search-seed.test.ts` usa um `PrismaClient` real.
  Com o `.env` apontando para a produção, a suíte **lê a produção**. Mais um motivo para o `dev-009`.
- **`prisma validate` exige `DATABASE_URL` definida**, mesmo sem conectar.
- **Rede lenta no `npm ci`:** cada consulta ao registro levou de 11 a 13 minutos para revalidar o
  cache. A raiz foi copiada localmente do checkout principal (lockfile idêntico), e o frontend
  instalado com `--prefer-offline`. As duas árvores foram conferidas com `npm ls`.
- **PowerShell 5.1 e `git commit -m` com aspas duplas** dentro de here-string quebram a mensagem em
  vários argumentos. Use `git commit -F <arquivo>`.

## 6. Onde o código vive

Ver "O que foi entregue" acima.

## 7. Para quem vier depois

—
