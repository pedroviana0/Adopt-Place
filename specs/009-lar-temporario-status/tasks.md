---

description: "Tarefas da spec 009 — Lar temporário e reforma do status"
---

# Tasks: Lar temporário e reforma do status

> **Exceção registrada em 2026-10-14:** nesta spec, por decisão do Pedro, o agente monta este arquivo
> e marca as tarefas concluídas como `[X]` na fase de implement. A regra geral do projeto (tasks.md
> só à mão) continua valendo para as outras specs.

**Input**: [`spec.md`](spec.md), [`plan.md`](plan.md), [`research.md`](research.md),
[`data-model.md`](data-model.md), [`contracts/http-contracts.md`](contracts/http-contracts.md),
[`quickstart.md`](quickstart.md).

**Tests**: obrigatórios. A constituição (IX) exige teste Vitest vermelho antes da implementação em
autorização, isolamento entre ONGs e transições com efeito. Os critérios CA-03 a CA-09 da spec também
pedem testes.

**Organization**: por **camada**, a pedido do Pedro (migration → backend → frontend → testes →
documentação), em vez de por história de usuário: a spec 009 não tem histórias. Cada tarefa cita
entre parênteses o **requisito** (RF, decisão D/C) e o **critério** (CA) que atende.

**Exceção deliberada à ordem das camadas:** os testes `[TEST-FIRST]` de caminho crítico ficam
**dentro da fase de backend**, imediatamente antes da tarefa que implementam, porque o princípio IX da
constituição exige que sejam escritos e falhem antes do código. A fase "Testes" cobre regressão
(privacidade), seed, ensaio do banco e homologação.

## Format: `[ID] [P?] [TEST-FIRST?] Descrição com caminho (RF…; CA…)`

- **[P]**: paralelizável (arquivo diferente, sem dependência de tarefa incompleta).
- **[TEST-FIRST]**: o teste precisa estar **vermelho** antes da tarefa de implementação seguinte e
  **verde** depois dela.
- **[Pedro]**: tarefa operacional de banco ou produção (console do Neon, `DATABASE_URL`, merge) que o
  Pedro executa no próprio terminal ou console; a IA prepara os comandos, mas não manuseia segredos
  (§2 do `CLAUDE.md`). O Pedro executa a 009 sozinho, com acordo do Arthur (D9 resolvido).

## Regras de portão (todas as fases)

- **Antes de cada commit:**
  - `npx tsc --noEmit` e `npm test` na raiz;
  - `npx tsc --noEmit` e `npm run build` em `frontend/`.
- **`routeTree.gen.ts`:** reverter se nenhuma rota nova foi adicionada; **commitar** a partir da Fase 3
  (rotas novas).
- **Commits:** mensagem convencional em PT com trailer `Co-Authored-By: Claude`, um por fase, na
  branch `009-lar-temporario-status`. Nunca na `main`.
- **Dev server:** não rodar o build do frontend com o `vite dev` de pé.
- **Fronteira:** cada commit precisa deixar backend e frontend coerentes entre si (§2 do `CLAUDE.md`).
  Por isso a remoção de `RESGATADO` no frontend está na Fase 1, junto da migration.

---

## Phase 1 — Migration e remoção de `RESGATADO`

**Objetivo:** schema e duas migrations prontos; nenhum uso de `RESGATADO` no código; portão verde.
**Teste independente:** `prisma validate` passa; `tsc` passa nos dois apps; `npm test` verde com as
fixtures atualizadas.

- [X] T001 [Pedro] Criar no console do Neon o branch **`dev-009`** a partir da produção, trocar o `DATABASE_URL` do `.env` local para a connection string desse branch e conferir que o host **não** é o endpoint da produção, conforme `quickstart.md` §0.1. Daqui até T097, toda migration da 009 roda **só** no `dev-009`, e o `npm run dev` usa só ele (C10, Clarification 2; CA-02, CA-09).
- [X] T002 Em `prisma/schema.prisma`, remover `RESGATADO` do enum `StatusAnimal` e trocar `Animal.status` para `@default(EM_CUIDADOS)`, sem nenhuma outra mudança (RF-001, D1; CA-02).
- [X] T003 No Git Bash, extrair `git show main:prisma/schema.prisma` para `.tmp-009/schema-main.prisma` e gerar `prisma/migrations/<ts1>_status_sem_resgatado/migration.sql` com `npx prisma migrate diff --from-schema-datamodel … --to-schema-datamodel prisma/schema.prisma --script`, conforme `quickstart.md` §1. O arquivo sai em UTF-8 sem BOM (RF-002, C10; CA-02).
- [X] T004 Em `prisma/migrations/<ts1>_status_sem_resgatado/migration.sql`, inserir logo depois de `BEGIN;` a linha `UPDATE "Animal" SET "status" = 'EM_CUIDADOS' WHERE "status" = 'RESGATADO';`. Conferir que a ordem bate com `research.md` R1 (UPDATE → CREATE TYPE → DROP DEFAULT → ALTER … USING → RENAME → DROP → SET DEFAULT) (RF-002; CA-02).
- [X] T005 Copiar `prisma/schema.prisma` para `.tmp-009/schema-pos-m1.prisma` e então acrescentar ao schema: enum `SituacaoLT`; model `LarTemporario` com `@@index([organizacaoId], map: "idx_lar_temporario_organizacao_id")`; em `Animal`, `situacaoLT @default(NAO_SE_APLICA)`, `larTemporarioId` e a relação `onDelete: SetNull`, mais `@@index([larTemporarioId], map: "idx_animal_lar_temporario_id")`; em `Organizacao`, `laresTemporarios LarTemporario[]`, conforme `data-model.md` §1 (RF-009, RF-011, C1, C6; CA-04, CA-06).
- [X] T006 Gerar `prisma/migrations/<ts2>_lar_temporario/migration.sql` (`ts2 > ts1`) com `migrate diff` a partir de `.tmp-009/schema-pos-m1.prisma`, **sem edição manual**. Conferir FK `ON DELETE SET NULL` em `Animal` e `ON DELETE CASCADE` em `LarTemporario`, e apagar `.tmp-009/` (RF-009, RF-025, C6; CA-06).
- [X] T007 Rodar `npm run prisma:validate` e `npm run prisma:generate` na raiz. Depois de repetir a conferência do host (`quickstart.md` §0.1), aplicar as duas migrations **no `dev-009`** com `npx prisma migrate deploy` (RF-001, RF-009; CA-02, CA-09).
- [X] T008 [P] Remover a chave `RESGATADO` de `statusInitial` em `lib/queries/operational-dashboard.ts` (RF-001; CA-02).
- [X] T009 [P] Remover `RESGATADO` do objeto `StatusAnimal` e de `statusAnimalLabel` em `frontend/src/lib/domain/enums.ts` (RF-003; CA-02).
- [X] T010 [P] Remover `StatusAnimal.RESGATADO` do `z.enum` de status em `frontend/src/lib/schemas/animal.ts` (RF-003; CA-02).
- [X] T011 [P] Remover a entrada `RESGATADO` do mapa de estilos em `frontend/src/components/app/StatusBadge.tsx` (RF-003; CA-02).
- [X] T012 [P] Trocar as fixtures `RESGATADO` por `EM_CUIDADOS` em `__tests__/actions/animais.test.ts` (linhas ~29, 229, 243, 260, 283, 306). Nos casos de transição, manter o sentido do teste (RF-003; CA-09).
- [X] T013 [P] Trocar as fixtures `RESGATADO` em `__tests__/actions/animal-publication.test.ts` (linhas ~30, 166, 180), preservando o caso "transição para DISPONIVEL exige 2 fotos" a partir de `EM_CUIDADOS` (RF-003, RF-005; CA-09).
- [X] T014 [P] Trocar a fixture `RESGATADO` em `__tests__/api/owner-animals.test.ts` (linha ~174) (RF-003; CA-09).
- [X] T015 [P] Criar `scripts/verify-009-migration.ts`, read-only com Prisma Client, no padrão de `scripts/verify-razao-social-normalizada.ts`. Ele imprime a contagem por `status` e por `situacaoLT`, o total de `LarTemporario` e as violações de I1–I4 de `data-model.md` §2.3, e sai com código ≠ 0 se houver violação (RF-002, RF-010, RF-011; CA-02).
- [X] T016 Rodar o portão completo e confirmar que não sobrou uso de `RESGATADO` com `git grep -n RESGATADO -- . ":!legacy" ":!specs" ":!prisma/migrations" ":!contextospecs_v2.md"`. A saída esperada é **vazia**: as migrations e o `contextospecs_v2.md` (documento histórico da raiz) ficam fora da busca de propósito (RF-001, RF-003; CA-02, CA-09).
- [X] T017 Commit da Fase 1 (`feat: remove status RESGATADO e cria lar temporario no schema`) com schema, as duas migrations, o verificador, os ajustes de backend e frontend e as fixtures (CA-02, CA-09).

**Checkpoint:** schema e migrations prontos e aplicados **só no `dev-009`**. A produção não foi tocada; o ensaio sobre cópia fresca da produção é a Fase 4, e a produção só recebe as migrations em T097.

---

## Phase 2 — Backend

**Objetivo:** regra de LT nos três caminhos até `ADOTADO`, API de LT, "em tratamento", filtros e
dashboard. Todas as mudanças de contrato são **aditivas**: o frontend antigo continua funcionando.
**Teste independente:** `npm test` verde com todos os `[TEST-FIRST]` desta fase.

### 2A — Regra de LT e os caminhos até `ADOTADO`

- [X] T018 [TEST-FIRST] Criar `__tests__/lib/lar-temporario.test.ts` para `resolveFosterState`, com estes casos (RF-010, RF-011, RF-012, RF-013, RF-013a; CA-03, CA-04):
  - campo ausente mantém o valor atual;
  - create sem campos gera `NAO_SE_APLICA`/`null`;
  - acolhedor com `PROCURANDO` ou com `larTemporarioId` → `FOSTER_STATE_NOT_ALLOWED`;
  - status final `ADOTADO` sem campos → reset;
  - `ADOTADO` com `situacaoLT` explícito diferente de `NAO_SE_APLICA` → `FOSTER_STATE_NOT_ALLOWED`;
  - `EM_LT` → `PROCURANDO` zera o vínculo;
  - `larTemporarioId` com `situacaoLT` explícito `PROCURANDO` → `INVALID_FOSTER_LINK`;
  - LT de outra ONG ou inexistente → `INVALID_FOSTER_LINK`.
- [X] T019 Criar `lib/lar-temporario.ts` (server-only) com `resolveFosterState(atual, entrada, contexto)` e a constante `FOSTER_RESET_ON_ADOPTION = { situacaoLT: NAO_SE_APLICA, larTemporarioId: null }`, seguindo as regras 1–5 de `research.md` R4. A única consulta é `prisma.larTemporario.findFirst({ where: { id, organizacaoId } })`. Estado atual com `situacaoLT`/`larTemporarioId` **ausentes** (`undefined`, como nos mocks antigos de `prisma.animal.findUnique` em `animal-publication.test.ts:69`) é tratado como `NAO_SE_APLICA`/`null`, sem exigir mudança nesses mocks. T018 fica verde (RF-010 a RF-013a; CA-03, CA-04).
- [X] T020 [P] Acrescentar `situacaoLT: z.nativeEnum(SituacaoLT).optional()` e `larTemporarioId: idSchema.nullable().optional()` ao `animalInputSchema` em `lib/schemas/animal.ts`, mantendo `.strict()` (RF-013a; CA-04).
- [X] T021 [TEST-FIRST] Em `__tests__/actions/animais.test.ts`, acrescentar casos de `createAnimal` e `updateAnimal`: com campos de LT ausentes, o `update` preserva o valor; status manual `ADOTADO` grava `NAO_SE_APLICA`/`null`; acolhedor com `PROCURANDO` → `FOSTER_STATE_NOT_ALLOWED`; `larTemporarioId` de outra ONG → `INVALID_FOSTER_LINK` (RF-010, RF-011, RF-013, RF-013a; CA-03, CA-04).
- [X] T022 [TEST-FIRST] Em `__tests__/actions/animais.test.ts`, acrescentar o caso em que `updateAnimalStatus(id, ADOTADO)` grava `{ status: ADOTADO, ...FOSTER_RESET_ON_ADOPTION }` (RF-013; CA-03).
- [X] T023 [TEST-FIRST] Em `__tests__/actions/solicitacoes.test.ts`, acrescentar o caso em que o `tx.animal.updateMany` de `completeAdoption` usa `data: { status: ADOTADO, situacaoLT: NAO_SE_APLICA, larTemporarioId: null }` no **mesmo** comando condicional `where: { status: EM_PROCESSO_ADOCAO }` (RF-013, C7; CA-03).
- [X] T024 Em `lib/actions/animais.ts`, mudar quatro pontos (RF-010 a RF-013a; CA-03, CA-04):
  - `findAnimalById` passa a selecionar `situacaoLT` e `larTemporarioId` (os mocks existentes sem esses campos continuam válidos; ver T019);
  - `createAnimal` e `updateAnimal` chamam `resolveFosterState` antes de gravar e devolvem o erro tipado;
  - `updateAnimal` monta `data` **explícito** (campos do animal + `situacaoLT` + `larTemporarioId` finais) no lugar de `data: parsed.data`;
  - T021 fica verde.
- [X] T025 Em `updateAnimalStatus` (`lib/actions/animais.ts`), espalhar `FOSTER_RESET_ON_ADOPTION` no `data` quando o status for `ADOTADO`. T022 fica verde (RF-013; CA-03).
- [X] T026 Em `completeAdoption` (`lib/actions/solicitacoes.ts:281`), espalhar `FOSTER_RESET_ON_ADOPTION` no `data` do `tx.animal.updateMany` existente. T023 fica verde (RF-013, C7; CA-03).

### 2B — API de lares temporários

- [X] T027 [P] Criar `lib/schemas/lar-temporario.ts` com os campos de `data-model.md` §2.1, reaproveitando `personNameSchema`, `phoneSchema`, `addressSchema` e `optionalTextSchema` de `lib/schemas/common.ts`. O create exige `autorizacaoTutor: z.literal(true)`; o update não tem esse campo; os dois são `.strict()` (RF-022, RF-022a, C3; CA-07).
- [X] T028 [P] Criar `requireActiveOrganization()` em `lib/api/responsible-http.ts`, que chama `requireActiveResponsible()` e devolve 403 `FORBIDDEN` quando `tipoPerfil !== ORGANIZACAO`. É usada pelas 5 rotas de LT (RF-020; CA-07).
- [X] T029 [TEST-FIRST] Criar `__tests__/api/lares-temporarios.test.ts` com os casos de cadastro e autorização (RF-020, RF-022, RF-022a, RF-026, C2, C3; CA-07):
  - `GET`/`POST /api/lares-temporarios`: acolhedor → 403; sem `autorizacaoTutor` → 400; telefone inválido → 400; válido → 201 com `organizacaoId` vindo da sessão;
  - `GET`/`PATCH`/`DELETE /api/lares-temporarios/[id]`: LT da ONG B → 404.
- [X] T030 [TEST-FIRST] Em `__tests__/api/lares-temporarios.test.ts`, acrescentar os casos de vínculo e exclusão (RF-023, RF-024, RF-025; CA-05, CA-06):
  - `GET /vinculaveis` filtra `situacaoLT: EM_LT, larTemporarioId: null, organizacaoId`;
  - `POST /[id]/animais` com `updateMany` condicional, e `count 0` → 409 `INVALID_TRANSITION`;
  - `DELETE /[id]/animais/[animalId]` mantém `situacaoLT` e devolve 404 quando o animal não está vinculado ao LT;
  - `DELETE /[id]` usa `deleteMany({ where: { id, organizacaoId } })`.
- [X] T031 Criar `lib/queries/lares-temporarios.ts` com três consultas: `getFosterHomes(organizacaoId)` (lista ordenada por `nomeTutor`, com `totalAnimais` via `_count`), `getFosterHomeDetail(id, organizacaoId)` (com animais vinculados e foto principal) e `getLinkableAnimals(organizacaoId)`, todas devolvendo os DTOs de `data-model.md` §4 (RF-021, RF-023, RF-024; CA-05).
- [X] T032 Criar `lib/actions/lares-temporarios.ts` com `createFosterHome`, `updateFosterHome` e `deleteFosterHome`, que recebem `ResponsibleContext`. Toda escrita filtra `organizacaoId: context.responsavelId`, e `autorizacaoTutor` é descartado antes do `create` (RF-022, RF-025, RF-026, C3, C4; CA-06, CA-07).
- [X] T033 Em `lib/actions/lares-temporarios.ts`, criar `linkAnimalToFosterHome` (confere que o LT é da ONG, depois faz `updateMany` com `where: { id, organizacaoId, situacaoLT: EM_LT, larTemporarioId: null }`) e `unlinkAnimalFromFosterHome` (`where: { id, organizacaoId, larTemporarioId: ltId }`, `data: { larTemporarioId: null }`) (RF-023, RF-024; CA-05).
- [X] T034 Criar `app/api/lares-temporarios/route.ts` com `GET` (lista) e `POST` (cria, 201), usando `requireActiveOrganization`, `readJson` e `actionErrorResponse` (RF-020, RF-021, RF-022; CA-07).
- [X] T035 [P] Criar `app/api/lares-temporarios/vinculaveis/route.ts` (`GET`) (RF-024; CA-05).
- [X] T036 Criar `app/api/lares-temporarios/[id]/route.ts` com `GET` (detalhe, 404 indistinguível), `PATCH` e `DELETE` (RF-022, RF-023, RF-025, RF-026; CA-06, CA-07).
- [X] T037 [P] Criar `app/api/lares-temporarios/[id]/animais/route.ts` (`POST { animalId }`; 409 quando o animal não é vinculável) (RF-024; CA-05).
- [X] T038 [P] Criar `app/api/lares-temporarios/[id]/animais/[animalId]/route.ts` (`DELETE`). T029 e T030 ficam verdes (RF-023; CA-05).

### 2C — "Em tratamento", filtros e dashboard

- [X] T039 [TEST-FIRST] Em `__tests__/queries/owned-animals.test.ts`, acrescentar os casos (RF-006, RF-016, RF-018; CA-01, CA-08):
  - o DTO traz `situacaoLT`, `larTemporario { id, nomeTutor }` e `emTratamento`;
  - `emTratamento` é `false` para animal `ADOTADO` com cuidado pendente;
  - o filtro `tratamento: "1"` aplica `inTreatmentWhere`;
  - `lt: "EM_LT_SEM_VINCULO"` vira `{ situacaoLT: EM_LT, larTemporarioId: null }`.
- [X] T040 [P] [TEST-FIRST] Em `__tests__/schemas/dashboard-filters.test.ts`, verificar que `lt` aceita os 4 valores e rejeita outros, e que `tratamento` aceita só `"1"` (RF-018; CA-08).
- [X] T041 [P] [TEST-FIRST] Em `__tests__/api/owner-animals.test.ts`, cobrir `GET /api/animais/gerenciados?lt=EM_LT` vindo de acolhedor → 400 `VALIDATION_ERROR` e o mesmo pedido vindo de ONG → 200 (RF-018; CA-07).
- [X] T042 [P] [TEST-FIRST] Em `__tests__/queries/operational-dashboard.test.ts`, cobrir três pontos (RF-017, RF-019; CA-01, CA-06, CA-08):
  - `animalsInTreatment` existe para ONG e para acolhedor;
  - `animalsSeekingFoster` e `animalsInFosterUnregistered` existem só para ONG;
  - os hrefs são `?tratamento=1`, `?lt=PROCURANDO` e `?lt=EM_LT_SEM_VINCULO`.

  `__tests__/actions/health-chat-dashboard-flow.test.ts` **não** ganha casos novos: ele só lê `indicators.overdueHealthCare` e `animalStatusCounts` (linhas 129, 140, 251, 259). O único ajuste permitido é acrescentar `vi.mocked(prisma.animal.count).mockResolvedValue(0)`, se as contagens novas quebrarem o fluxo por falta de mock.
- [X] T043 Acrescentar `inTreatmentWhere` a `lib/lar-temporario.ts`: `status` diferente de `ADOTADO` + `cuidadosPlanejados.some({ tipo: MEDICAMENTO_TRATAMENTO, status: PENDENTE })`, conforme `research.md` R5 (RF-006, C8; CA-08).
- [X] T044 Em `lib/queries/owned-animals.ts`, mudar o select e o DTO (RF-006, RF-016; CA-01, CA-08):
  - `ownedAnimalSummarySelect` ganha `situacaoLT`, `larTemporario: { select: { id, nomeTutor } }` e `_count.cuidadosPlanejados` com o filtro de tratamento;
  - `toOwnedAnimalDTO` calcula `emTratamento`.
- [X] T045 [P] Acrescentar `lt` e `tratamento` ao `ownedAnimalFilterSchema` em `lib/schemas/dashboard-filters.ts`. T040 fica verde (RF-018; CA-08).
- [X] T046 Em `buildFilterWhere` (`lib/queries/owned-animals.ts`), aplicar `lt` (incluindo `EM_LT_SEM_VINCULO`) e `tratamento` com `inTreatmentWhere`. T039 fica verde (RF-018; CA-01, CA-08).
- [X] T047 No `GET` de `app/api/animais/gerenciados/route.ts`, responder 400 `VALIDATION_ERROR` quando `filters.data.lt` vier de um contexto `ACOLHEDOR`. T041 fica verde (RF-018; CA-07).
- [X] T048 Em `lib/queries/operational-dashboard.ts`, criar os 3 indicadores com `prisma.animal.count`: `ownerWhere` + `inTreatmentWhere`; `situacaoLT: PROCURANDO`; `situacaoLT: EM_LT, larTemporarioId: null`. Os dois de LT ficam só para ONG. T042 fica verde (RF-017, RF-019; CA-01, CA-06, CA-08).
- [X] T049 Rodar o portão completo e confirmar que nenhum teste pré-existente mudou de sentido (CA-09).
- [X] T050 Commit da Fase 2 (`feat: regra de lar temporario, api de LT e indicadores de tratamento`) (CA-03 a CA-08).

**Checkpoint:** a API completa existe e está testada. O frontend antigo continua funcionando, porque todos os campos novos são opcionais ou aditivos.

---

## Phase 3 — Frontend

**Objetivo:** campos no `AnimalForm`, badges, filtros que leem a URL, cards, a aba de LT e o
formulário de tratamento.
**Teste independente:** `tsc` e `build` do frontend; roteiro H1 a H13 na Fase 4.

### 3A — Domínio, schemas e dados

- [X] T051 [P] Em `frontend/src/lib/domain/enums.ts`, acrescentar três coisas: o objeto `SituacaoLT`; `situacaoLTLabel` ("Não precisa", "Procurando LT", "Em LT"); e `statusAnimalHelp` com o texto de ajuda por status (`EM_CUIDADOS`: "Não aparece na vitrine. Use enquanto o animal não pode ser anunciado."; `DISPONIVEL`: "Aparece na vitrine. Pode estar em tratamento."; mais uma frase curta para os outros dois) (RF-004, C13, C14; CA-02).
- [X] T052 [P] Em `frontend/src/lib/domain/types.ts`, acrescentar `situacaoLT`, `larTemporario` e `emTratamento` ao animal gerenciado, e os tipos `LarTemporarioDTO` e `LarTemporarioDetailDTO` (RF-016, RF-021; CA-01).
- [X] T053 [P] Acrescentar `situacaoLT` e `larTemporarioId` opcionais ao `animalSchema` em `frontend/src/lib/schemas/animal.ts` (RF-013a; CA-04).
- [X] T054 [P] Criar `frontend/src/lib/schemas/larTemporario.ts`, espelhando o servidor com `phoneSchema`, `personNameSchema` e `addressSchema` de `frontend/src/lib/schemas/common.ts`. A cidade tem de 2 a 80 caracteres, as observações até 1.000, e `autorizacaoTutor` é obrigatório só no create (RF-022, RF-022a; CA-07).
- [X] T055 [P] Criar `frontend/src/lib/data/lares-temporarios.ts` com as funções `fetchLaresTemporarios`, `fetchLarTemporario`, `criarLarTemporario`, `atualizarLarTemporario`, `excluirLarTemporario`, `fetchVinculaveis`, `vincularAnimalLT` e `desvincularAnimalLT`, todas via `apiRequest` (RF-020 a RF-025; CA-05, CA-06).
- [X] T056 Em `frontend/src/lib/data/animais.ts`, aceitar `lt` e `tratamento` em `fetchAnimaisGerenciados` e tipar os campos novos do DTO (RF-018; CA-08).
- [X] T057 [P] Em `frontend/src/lib/data/dashboard.ts`, tipar `animalsInTreatment` e, como opcionais, `animalsSeekingFoster` e `animalsInFosterUnregistered` (RF-017; CA-01).

### 3B — Animal: formulário, lista, detalhe, dashboard

- [X] T058 [P] Criar `frontend/src/components/app/AnimalIndicators.tsx` com os badges "Em tratamento", "Procurando LT", "Em LT · <nomeTutor>" e "Em LT · sem registro". O texto é sempre visível, e só tokens semânticos (§8 do `CLAUDE.md`). Os badges de LT aparecem só quando `situacaoLT ≠ NAO_SE_APLICA` (RF-016, C15; CA-01).
- [X] T059 No `frontend/src/components/app/AnimalForm.tsx`, mostrar `statusAnimalHelp[form.status]` sob o select de Status (RF-004, C13; CA-02).
- [X] T060 No `AnimalForm.tsx`, só quando a sessão for `ORGANIZACAO` e o status não for `ADOTADO`, mostrar (RF-014, C12; CA-04):
  - o select "Lar temporário (LT)";
  - com `EM_LT`, o select "Vinculado a", carregado de `fetchLaresTemporarios`, com a opção "Ainda não registrado" (= `null`).
- [X] T061 No submit do `AnimalForm.tsx`, decidir o envio dos campos de LT (RF-012, RF-013, RF-013a; CA-03, CA-04):
  - **omitir** `situacaoLT` e `larTemporarioId` quando o status for `ADOTADO` ou o perfil for acolhedor;
  - nos outros casos (ONG), enviar sempre os dois, com **`larTemporarioId: null` sempre que `situacaoLT ≠ EM_LT`**, mesmo que o estado do formulário ainda guarde o LT anterior. Sem isso, o backend responde `INVALID_FOSTER_LINK` ao trocar `EM_LT` vinculado por `PROCURANDO` (roteiro H7).
- [X] T062 No `AnimalForm.tsx`, mostrar o aviso inline "O vínculo com <nomeTutor> será removido" quando o animal estava `EM_LT` vinculado e o usuário escolher outro valor (RF-012, C5; CA-04).
- [X] T063 Em `frontend/src/routes/_authenticated.dashboard.animais.index.tsx`, acrescentar `validateSearch` (`status`, `lt`, `tratamento`) e trocar o `useState` do filtro de status pela URL, para que os links dos cards filtrem a lista (RF-019; CA-01, CA-06, CA-08).
- [X] T064 Na mesma rota, acrescentar o select de LT (só ONG) e o filtro "Em tratamento", e renderizar `<AnimalIndicators>` ao lado do `StatusBadge` em cada linha (RF-016, RF-018; CA-01, CA-08).
- [X] T065 [P] Renderizar `<AnimalIndicators>` ao lado do status em `frontend/src/routes/_authenticated.dashboard.animais.$animalId.tsx` (RF-016; CA-01).
- [X] T066 [P] Acrescentar à grade de indicadores de `frontend/src/routes/_authenticated.dashboard.index.tsx` os cards "Em tratamento" (sempre), "Procurando LT" e "Em LT sem registro" (só quando o indicador vier no JSON), com links via `resolveHref` (RF-017, RF-019, C16; CA-01, CA-06, CA-08).

### 3C — Aba "Lares temporários"

- [X] T067 Em `frontend/src/routes/_authenticated.dashboard.tsx`, acrescentar o item de menu "Lares temporários", que só aparece para `ORGANIZACAO` (RF-020; CA-07).
- [X] T068 [P] Criar `frontend/src/routes/_authenticated.dashboard.lares-temporarios.tsx` com `<Outlet />`, igual a `…animais.tsx` (RF-020; CA-07).
- [X] T069 Criar `frontend/src/routes/_authenticated.dashboard.lares-temporarios.index.tsx` com quatro partes (RF-020, RF-021, RF-022, RF-022a, C3; CA-07):
  - a lista (nome, cidade, telefone, total de animais) com `page-canvas`;
  - busca por nome no cliente, normalizando acentos com `normalize("NFD")`;
  - diálogo "Novo LT" com o schema de T054 e o checkbox de autorização obrigatório;
  - para acolhedor, uma explicação ("disponível só para organizações"), sem redirect.
- [X] T070 Criar `frontend/src/routes/_authenticated.dashboard.lares-temporarios.$larId.tsx` com os dados do LT, a edição (sem checkbox) e a lista de animais vinculados com o botão "Desvincular" (RF-022, RF-023; CA-05).
- [X] T071 Em `….lares-temporarios.$larId.tsx`, acrescentar o diálogo "Vincular animal", que lista só `fetchVinculaveis()` e mostra estado vazio quando não há candidatos (RF-024; CA-05).
- [X] T072 Em `….lares-temporarios.$larId.tsx`, acrescentar o diálogo "Excluir LT", que lista os animais vinculados e avisa que eles continuarão "Em LT · sem registro". Depois de confirmar, volta à lista (RF-025, C4; CA-06).

### 3D — Saúde: tratamento alcançável

- [X] T073 [P] Em `frontend/src/lib/data/saude.ts` e `frontend/src/lib/data/cuidados.ts`, aceitar `dataProxima?: string` no payload `MEDICAMENTO_TRATAMENTO` (RF-008; CA-08).
- [X] T074 [P] Acrescentar a variante `MEDICAMENTO_TRATAMENTO` (`medicamentoTratamento`, `dataAplicacao`, `dataProxima?` posterior à aplicação) em `frontend/src/lib/schemas/registroSaude.ts` (RF-008; CA-08).
- [X] T075 Criar `TratamentoForm` em `frontend/src/components/app/HealthPanel.tsx`, no molde do `ParasitaForm`, com o campo "Próxima dose" e a dica "Informe a próxima dose para o animal aparecer como em tratamento" (RF-008, C9; CA-01, CA-08).
- [X] T076 No `CompletionForm` de `frontend/src/routes/_authenticated.dashboard.saude.index.tsx`, acrescentar "Próxima dose (opcional)" quando `item.tipo === "MEDICAMENTO_TRATAMENTO"`, enviado como `dataProxima` (RF-008; CA-08).
- [X] T077 Rodar o portão completo. **Commitar** `frontend/src/routeTree.gen.ts`, regenerado pelas rotas novas (CA-09).
- [ ] T078 Commit da Fase 3 (`feat: telas de lar temporario, indicadores e tratamento`) (CA-01 a CA-08).

**Checkpoint:** sistema completo em código. Falta provar contra banco real.

---

## Phase 4 — Testes, seed e homologação

**Objetivo:** regressão de privacidade, seed coerente, migrations provadas no branch Neon e roteiro
H1 a H13 aprovado.
**Teste independente:** verificador sem violações; H1 a H13 registrados no `ENTREGA.md`.

- [ ] T079 [P] Criar `__tests__/queries/lt-privacy.test.ts`. Com o Prisma mockado, ele chama as queries de `lib/queries/animal-showcase.ts`, `public-animal.ts`, `feels.ts`, `favorites.ts`, `public-profiles.ts`, `adopter-requests.ts`, `adotante-dashboard.ts` e `mensagens.ts`, e falha se algum argumento de consulta ou DTO contiver `situacaoLT`, `larTemporario`, `larTemporarioId` ou `emTratamento`. Demonstrar o vermelho trocando temporariamente um `select` por `include` (RF-015, D7, Clarification 1; CA-01).
- [ ] T080 Em `prisma/seed.ts`, acrescentar `prisma.larTemporario.deleteMany()` ao `clearTestData`, antes de `prisma.organizacao.deleteMany()` (RF-027; CA-09).
- [ ] T081 Em `prisma/seed.ts`, criar `createDemoLaresTemporarios()`, que cria 2 LTs fictícios da `organizacao.teste@example.com`, localizada pelo e-mail do usuário (RF-027, C19; CA-05).
- [ ] T082 Em `createDemoAnimals` (`prisma/seed.ts`), distribuir `situacaoLT` nos animais de ONG por `i % 3` (NAO_SE_APLICA, PROCURANDO, EM_LT). Nos `EM_LT` da `organizacao.teste`, rodar o vínculo LT1 → LT2 → sem registro. Os de acolhedor ficam `NAO_SE_APLICA`. Conferir que o período 3 não se alinha com espécie, sexo e responsável (§11 do `CLAUDE.md`) (RF-027, C19; CA-05, CA-06).
- [ ] T083 Em `prisma/seed.ts`, criar a **Seninha**: gata da `organizacao.teste`, `DISPONIVEL`, 2 fotos, `PROCURANDO`, com um `RegistroSaude` `MEDICAMENTO_TRATAMENTO` ("Antibiótico") de hoje e o `CuidadoPlanejado` `PENDENTE` originado dele, com a próxima dose daqui a 2 dias (RF-027, C19; CA-01).
- [ ] T084 [Pedro] Criar no console do Neon o branch descartável **`seed-009`** com a opção **"Schema only"** (sem dados) e apontar `$env:DATABASE_URL` **só no terminal** para ele, sem mexer no `.env`. Conferir o host, que não pode ser o da produção nem o do `dev-009`, conforme `quickstart.md` §5. O seed **nunca** roda no `dev-009` nem na produção (RF-027; CA-01, CA-09).
- [ ] T085 No terminal apontado para o `seed-009`, rodar `npx prisma migrate reset --force`, que recria o schema pelas migrations e executa o seed. Subir o app nesse terminal e conferir 37 animais, 2 LTs e a Seninha com os badges e cards corretos no painel da `organizacao.teste`. Ao terminar, **[Pedro]** apagar o branch `seed-009` (RF-027; CA-01).
- [ ] T086 Rodar o portão completo e fazer o commit da Fase 4 (`test: privacidade de LT e seed da spec 009`) (CA-01, CA-09).
- [ ] T087 [Pedro] No console do Neon, criar o branch `validacao-009` a partir da produção, apontar `$env:DATABASE_URL` para ele no próprio terminal e anotar `SELECT status, count(*) FROM "Animal" GROUP BY status;` (RF-002, C10; CA-02).
- [ ] T088 No branch, rodar `npx prisma migrate deploy`, `npx prisma migrate status`, `npx prisma migrate diff --from-url "$env:DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` (deve dar 0) e `npx tsx scripts/verify-009-migration.ts`. Comparar com a contagem de T087 (RF-002, RF-009; CA-02).
- [ ] T089 Homologar H1 a H4 do `quickstart.md` §3 contra o branch: status sem "Resgatado", cadastro de LT, preparação da Seninha e ausência de LT e tratamento em todo JSON público e de adotante (RF-003, RF-004, RF-008, RF-015, RF-022; CA-01, CA-02, CA-07).
- [ ] T090 Homologar H5 a H8: badges, cards e filtros; vínculo pela aba e pelo formulário; saída de `EM_LT`; exclusão de LT (RF-012, RF-016 a RF-019, RF-023 a RF-025; CA-01, CA-04, CA-05, CA-06).
- [ ] T091 Homologar H9 a H13: próxima dose na agenda, `ADOTADO` pelos dois caminhos da interface, acolhedor, outra ONG, teclado, zoom 200% e contraste AA (RF-008, RF-013, RF-018, RF-020, RF-026; CA-03, CA-07, CA-08).
- [ ] T092 [Pedro] Apagar o branch `validacao-009` depois da homologação, porque contém cópia de dados reais (C2, LGPD; CA-07).

**Checkpoint:** pronto para PR e virada.

---

## Phase 5 — Documentação, PR e virada

**Objetivo:** registro factual, PR e produção na ordem obrigatória.

- [ ] T093 [P] Preencher `specs/009-lar-temporario-status/ENTREGA.md` no modelo de `specs/README.md`: promessa × estado, entregas por fase **com hash**, decisões que não se reabrem, o que não foi entregue, armadilhas (terceiro caminho até `ADOTADO`, cards que não filtravam, enum no PostgreSQL), onde o código vive e o resultado de H1 a H13 (CA-09).
- [ ] T094 [P] Em `specs/README.md`, atualizar a linha 009 para "Em homologação" e depois para "Entregue (data)" (D9; CA-09).
- [ ] T095 [P] Atualizar o §10 do `CLAUDE.md` com quatro pontos: status sem `RESGATADO` e `EM_CUIDADOS` = "não anunciado"; LT só na gestão da ONG; seed com 37 animais e 2 LTs; migrations antes do merge. Acrescentar a armadilha "três caminhos gravam `Animal.status`" ao §9.1 (D1, D9, C7; CA-09).
- [ ] T096 Abrir o PR da branch `009-lar-temporario-status` para a `main`, **sem merge**. A descrição traz o resumo, os CAs, o resultado da homologação e a **ordem de virada** do `quickstart.md` §4, com o rodapé do Claude Code (Clarification 2; CA-09).
- [ ] T097 [Pedro] Criar o branch de backup `pre-009` no Neon e, com a `DATABASE_URL` de produção, rodar `npx prisma migrate deploy` e depois `npx tsx scripts/verify-009-migration.ts` (Clarification 2, C10; CA-02).
- [ ] T098 [Pedro] Com o verificador verde, fazer o merge do PR e fazer o smoke em produção: a vitrine abre, a ONG vê os cards novos, a aba de LT abre. Em falha, usar o rollback do `quickstart.md` §4 (Clarification 2; CA-01, CA-02).
- [ ] T099 Registrar no `ENTREGA.md` o número do PR, o hash do merge, a data da virada e o estado "Entregue" (CA-09).
- [ ] T100 [Pedro, fora do repo] Atualizar o DER, o diagrama de classes, os casos de uso e a doc v21 do TCC com `LarTemporario`, `SituacaoLT` e o enum novo, antes do congelamento para a banca de 02/12/2026 (D9).
- [ ] T101 [Pedro] **7 dias depois da virada** (T098), sem incidente, apagar no console do Neon o branch de backup `pre-009`. No mesmo momento, apagar o `dev-009` e voltar o `DATABASE_URL` do `.env` local para o branch de trabalho habitual. Os dois branches contêm cópia de dados reais (C2, LGPD; CA-07).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1 (Migration)**: sem dependências. Bloqueia todas as outras. **T001 (branch `dev-009`) vem antes de qualquer tarefa que gere Prisma Client, aplique migration ou suba o app.**
- **Fase 2 (Backend)**: depende da 1. Dentro dela:
  - 2A vem antes de 2B e 2C (o `lib/lar-temporario.ts` nasce em 2A);
  - 2B e 2C podem correr em paralelo depois da 2A.
- **Fase 3 (Frontend)**: depende da 2.
  - 3D (saúde) depende só da Fase 1 e pode ser antecipada.
  - 3C depende de 2B; 3B depende de 2A e 2C.
- **Fase 4 (Testes)**:
  - T079 depende só da Fase 1 e pode correr junto com a 2;
  - o seed (T080–T085) depende da Fase 1 e roda só no branch descartável `seed-009` (T084);
  - o ensaio e a homologação (T087–T092) dependem das Fases 1 a 3.
- **Fase 5 (Documentação)**: depende da 4. A ordem T097 → T098 é **obrigatória**: migration em produção antes do merge. T101 só acontece 7 dias depois de T098.

### Dentro de cada bloco

- `[TEST-FIRST]` vermelho → implementação → verde.
- Schema e migration antes de action ou rota.
- Validação Zod no servidor antes da operação; `requireActiveResponsible`/`requireActiveOrganization` antes de tocar dados.

### Caminho crítico até 06/11/2026

T001–T017 → T018–T026 → T039–T048 → T058–T066 → T087–T091 → T096–T098.

---

## Parallel Examples

```text
# Fase 1, depois de T007:
T008 operational-dashboard.ts | T009 enums.ts | T010 schemas/animal.ts | T011 StatusBadge.tsx
T012 animais.test.ts | T013 animal-publication.test.ts | T014 owner-animals.test.ts | T015 verify-009-migration.ts

# Fase 2, depois de 2A:
Bloco 2B (T027–T038) || Bloco 2C (T039–T048)
Dentro da 2C: T040 | T041 | T042 (testes em arquivos distintos)

# Fase 3:
T051 | T052 | T053 | T054 | T055 | T057 | T058 | T073 | T074
```

---

## Implementation Strategy

### Incremento mínimo demonstrável (caso Seninha no painel)

Fases 1 e 2A, 2C, 3A, 3B e 3D, mais o seed T080–T085. Com isso, a Seninha aparece `DISPONIVEL` na
vitrine sem sinal de LT, e com "Em tratamento" e "Procurando LT" no painel (CA-01). A aba de LT
(2B + 3C) completa o restante.

### Entrega incremental

Cada fase termina num commit com o portão verde e no registro do hash no `ENTREGA.md`. Nenhum commit
deixa a fronteira backend/frontend quebrada, porque as mudanças de contrato da Fase 2 são aditivas.

---

## Rastreabilidade (RF/CA → tarefas)

| Requisito | Tarefas |
|---|---|
| RF-001 a RF-003 | T002–T004, T007–T014, T016 |
| RF-004 | T051, T059 |
| RF-005 | T013 (regra preservada) |
| RF-006, RF-007 | T039, T043, T044, T046, T058 |
| RF-008 | T073–T076 |
| RF-009 a RF-013a | T005, T006, T018–T026, T053, T060–T062 |
| RF-014 | T060–T062 |
| RF-015 | T079, T089 |
| RF-016 a RF-019 | T039–T048, T056–T058, T063–T066 |
| RF-020 a RF-026 | T027–T038, T054, T055, T067–T072 |
| RF-027 | T080–T085 |

| Critério | Tarefas que o provam |
|---|---|
| CA-01 | T044, T058, T064–T066, T079, T083–T085, T089, T090, T098 |
| CA-02 | T001–T017, T087, T088, T097 |
| CA-03 | T018, T021–T026, T061, T091 |
| CA-04 | T018, T021, T024, T060–T062, T090 |
| CA-05 | T030, T033, T035, T037, T038, T071, T090 |
| CA-06 | T030, T032, T036, T048, T072, T090 |
| CA-07 | T027–T029, T034, T041, T047, T067, T069, T091, T092, T101 |
| CA-08 | T039, T040, T043, T046, T048, T073–T076, T091 |
| CA-09 | T001, T007, T016, T049, T077, T084, T086, T093–T096, T099 |

## Notes

- Este `tasks.md` foi montado pelo agente com autorização do Pedro (2026-10-14); o agente marca `[X]` ao concluir cada tarefa.
- Nada de SQL fora da migration de T004. Nada de `any` explícito, de dependência nova ou de edição em `legacy/`.
- O seed nunca roda contra banco com dados reais: só no branch descartável `seed-009` (T084–T085), nunca no `dev-009` nem na produção.
- Bancos da 009: `dev-009` (desenvolvimento, desde T001), `seed-009` (seed, descartável), `validacao-009` (ensaio sobre cópia fresca, T087–T092), `pre-009` (backup da virada, T097; apagado em T101). A produção só recebe migration em T097.
- A IA não manuseia `DATABASE_URL` nem cria contas: as tarefas `[Pedro]` são executadas pelo Pedro.
