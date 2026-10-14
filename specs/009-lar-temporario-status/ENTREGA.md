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
| 1 | Migration e remoção de `RESGATADO` | Concluída (`fd8f99c`); migrations aplicadas no `dev-009` pelo Pedro |
| 2 | Backend (regra de LT, API de LT, tratamento, dashboard) | Concluída (`e708562`) |
| 3 | Frontend | Concluída em código (`213854c`); homologação visual na Fase 4 |
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

**Fechamento da Fase 1:** o Pedro fez T001 (branch `dev-009`, `.env` apontado) e T007
(`migrate deploy`). Conferido em 2026-10-14: `prisma migrate status` no host do `.env` mostra 7
migrations, as duas da 009 incluídas, e "Database schema is up to date". Como a produção só recebe
migration em T097, isso também confirma que o `.env` não aponta para a produção.

### Fase 2 — backend (commit `e708562`)

- `lib/lar-temporario.ts`:
  - `resolveFosterState`: campo ausente mantém o valor; acolhedor sem LT; `ADOTADO` zera; vínculo
    exige `EM_LT` e LT da própria ONG;
  - `FOSTER_RESET_ON_ADOPTION`;
  - `pendingTreatmentCareWhere` e `inTreatmentWhere`, a regra única de "em tratamento".
- Reset de LT nos **três** caminhos até `ADOTADO`:
  - `completeAdoption`, no mesmo `updateMany` condicional;
  - `updateAnimal`;
  - `updateAnimalStatus`.

  `createAnimal` e `updateAnimal` passam pela mesma regra.
- `lib/schemas/animal.ts`: `situacaoLT` e `larTemporarioId` opcionais.
- API `/api/lares-temporarios`:
  - rotas `route.ts`, `vinculaveis`, `[id]`, `[id]/animais` e `[id]/animais/[animalId]`;
  - `requireActiveOrganization` em `lib/api/responsible-http.ts`;
  - schemas em `lib/schemas/lar-temporario.ts`, consultas em `lib/queries/lares-temporarios.ts` e
    actions em `lib/actions/lares-temporarios.ts`.
- Gestão de animais:
  - o DTO ganha `situacaoLT`, `larTemporario { id, nomeTutor }` e `emTratamento`;
  - filtros `lt` (com `EM_LT_SEM_VINCULO`) e `tratamento=1`;
  - `lt` vindo de acolhedor responde 400.
- Dashboard: `animalsInTreatment` e, só para ONG, `animalsSeekingFoster` e
  `animalsInFosterUnregistered`.

**Validação (2026-10-14):**
- todos os testes novos foram escritos antes e vistos **vermelhos** antes da implementação;
- `npm test`: **419/420**. A falha é a mesma de antes (`organization-search-seed.test.ts`), agora
  explicada na seção 5;
- `tsc` OK no backend e no frontend;
- build do frontend OK; `routeTree.gen.ts` inalterado.

### Fase 3 — frontend (commit `213854c`)

- `AnimalForm`:
  - ajuda dinâmica sob o Status (`statusAnimalHelp`);
  - para organização e status diferente de `ADOTADO`, os selects "Lar temporário (LT)" e "Vinculado
    a" (LTs da ONG + "Ainda não registrado");
  - aviso "O vínculo com <tutor> será removido ao salvar";
  - os campos de LT são omitidos em `ADOTADO` e para acolhedor, e `larTemporarioId` vai `null` sempre
    que a situação não é `EM_LT` (correção U1 da análise).
- `components/app/AnimalIndicators.tsx`: badges "Em tratamento", "Procurando LT", "Em LT · <tutor>"
  e "Em LT · sem registro", com pares de token `*-muted`/`*-muted-foreground` e texto sempre visível.
- "Meus animais" (`_authenticated.dashboard.animais.index.tsx`):
  - `validateSearch` com `status`, `lt` e `tratamento`; valor inválido na URL vira "sem filtro";
  - o filtro de LT aparece só para ONG, e o checkbox "Só em tratamento" para todos;
  - badges em cada linha.
- Detalhe do animal: `StatusBadge` + `AnimalIndicators` no cabeçalho.
- Painel: cards "Em tratamento", "Procurando LT" e "Em LT sem registro". Os dois de LT aparecem só
  quando vêm no JSON, ou seja, só para ONG.
- Aba "Lares temporários":
  - menu só para ONG;
  - rotas `lares-temporarios.tsx`, `.index.tsx` e `.$larId.tsx`;
  - componente `LarTemporarioForm.tsx`, usado no cadastro e na edição;
  - busca por nome no cliente, sem acento;
  - diálogos de cadastro (com a autorização obrigatória), edição, vincular (só candidatos `EM_LT`
    sem vínculo), desvincular e excluir (lista os animais que ficam "Em LT · sem registro");
  - acolhedor vê uma explicação, sem redirect.
- Saúde:
  - aba "Tratamentos" no `HealthPanel`, com `TratamentoForm` (próxima dose + dica do RF-008)
    validado pelo `registroSaudeSchema` do cliente;
  - no `CompletionForm` da agenda, "Próxima dose (opcional)" para `MEDICAMENTO_TRATAMENTO`;
  - as duas telas invalidam lista, detalhe e painel, para o badge refletir a mudança.
- `routeTree.gen.ts`: regenerado e commitado. O diff tem só as 79 linhas adicionadas das rotas novas,
  nenhuma removida.

**Validação (2026-10-14):**
- build do frontend OK;
- `tsc` do frontend OK;
- o backend não mudou nesta fase (`npm test` da Fase 2 vale).

**A interface ainda não foi vista rodando.** A homologação visual e funcional (H1–H13) é da Fase 4.

## 3. Decisões que não se reabrem

- As migrations foram geradas contra `HEAD:prisma/schema.prisma`, **não** contra `main:`. A `main`
  local deste repositório (`58a8856`) está atrás da base da branch (`95f54d1`), e um diff contra ela
  sairia errado. Quem regerar migration nesta base deve conferir `git rev-parse main` antes.
- Nos testes, as fixtures `RESGATADO` que testavam uma **transição** viraram outro status de origem
  (`DISPONIVEL → EM_CUIDADOS` e `EM_PROCESSO_ADOCAO → EM_CUIDADOS`), para não virar transição nula. No
  `owner-animals.test.ts`, a troca para `EM_CUIDADOS` garante que o 400 continue vindo do
  `organizacaoId` recusado, e não de um status inválido.
- `createAnimal` passa a gravar `situacaoLT`/`larTemporarioId` resolvidos, iguais ao default do
  banco quando ausentes. Os dois testes que comparavam o `data` exato do create foram atualizados.
- O teste de allowlist do DTO de gestão (`owner-animals.test.ts`) ganhou os 3 campos novos. A lista
  de campos proibidos (`telefone`, `endereco`, …) ficou intacta e passa a provar que o telefone e o
  endereço do **tutor** não saem no DTO do animal: só `id` e `nomeTutor`.
- `lib/actions/lares-temporarios.ts` **não** é `"use server"`. É chamado só pelas rotas, que já
  autenticam e validam; sem a diretiva, as funções não viram Server Actions chamáveis do navegador.
- O filtro `tratamento` entra em `AND: [inTreatmentWhere]`, para não colidir com o filtro `status`
  da mesma consulta (`inTreatmentWhere` também restringe `status`).
- **Divergências do `tasks.md` na Fase 3, resolvidas pelo código real:**
  - **T052:** os campos novos do animal gerenciado ficaram em `lib/data/animais.ts`
    (`OwnedAnimalSummary`), onde o DTO de gestão já vivia, e não em `domain/types.ts`. Os tipos de LT
    ficaram em `lib/data/lares-temporarios.ts`.
  - **T054:** o schema de cliente do LT virou `larTemporarioFormSchema(mode)`, com `autorizacaoTutor`
    booleano e exigido só no cadastro. Um `z.literal(true)` não aceita o checkbox desmarcado como
    estado inicial do formulário. O contrato HTTP continua enviando `autorizacaoTutor: true`.
  - **T069:** a lista de LT **não** usa `page-canvas`. Nenhuma página do painel usa, porque o fundo é
    do layout, e repetir dentro dele cria o "fundo por seção" proibido no §8 do `CLAUDE.md`.
  - **T073:** `lib/data/cuidados.ts` já aceitava `dataProxima` em `MEDICAMENTO_TRATAMENTO`; só o
    `saude.ts` mudou.

## 4. O que a spec previa e não foi entregue

—

## 5. Armadilhas descobertas

- **`organization-search-seed.test.ts` usa um `PrismaClient` real**, não o mock. O `vitest.config.ts`
  não carrega `.env`, então o teste só acha `DATABASE_URL` se a variável estiver exportada **no
  terminal**. Nesse caso ele lê o banco para onde ela aponta, inclusive a produção. Nesta worktree, com
  `.env` mas sem a variável no terminal, ele falha com "Environment variable not found" tanto antes
  quanto depois da 009. Não é regressão.
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
