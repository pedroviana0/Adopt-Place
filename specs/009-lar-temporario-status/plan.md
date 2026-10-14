# Implementation Plan: Lar temporário e reforma do status

**Branch**: `009-lar-temporario-status` | **Date**: 2026-10-14 | **Spec**: [`spec.md`](spec.md)

**Input**: Feature specification from `specs/009-lar-temporario-status/spec.md`.
Também: [`GRILLING-BRIEF.md`](GRILLING-BRIEF.md) (D1–D9), a sabatina (C1–C19) e as Clarifications de
2026-10-14.

**Artefatos desta fase:** [`research.md`](research.md) · [`data-model.md`](data-model.md) ·
[`contracts/http-contracts.md`](contracts/http-contracts.md) · [`quickstart.md`](quickstart.md).
[`tasks.md`](tasks.md): nesta spec, por decisão do Pedro em 2026-10-14, o agente pode montá-lo e
marcar tarefas concluídas como `[X]` (exceção à regra do brief).

## Summary

O campo `Animal.status` passa a guardar só a etapa da adoção. A spec tem quatro frentes:

1. **Status.** `RESGATADO` sai do enum, e as linhas existentes viram `EM_CUIDADOS` (o novo "ainda não
   anunciado").
2. **"Em tratamento".** É derivado, sem coluna: existe `CuidadoPlanejado` `MEDICAMENTO_TRATAMENTO`
   `PENDENTE` e o animal não está `ADOTADO`.
3. **Lar temporário.** Novo campo `Animal.situacaoLT` e nova entidade `LarTemporario`, ambos só da
   Organização, só na gestão e com invariantes garantidas no backend.

   A regra de LT vive num único módulo server-only, `lib/lar-temporario.ts`. Ele é chamado pelos
   **três** caminhos que gravam status: `completeAdoption`, `updateAnimal` e `updateAnimalStatus`, este
   último encontrado durante o planejamento. Também é chamado por `createAnimal`.
4. **Banco e telas.**
   - Duas migrations Prisma, geradas offline com `migrate diff`. A primeira leva um `UPDATE` de dados
     escrito à mão, com precedente na 006.
   - As migrations são ensaiadas num branch do Neon e aplicadas na produção **antes** do merge.
   - No frontend, entram a aba "Lares temporários", os campos no `AnimalForm`, badges, filtros e
     cards no painel, e o formulário de "Medicamento / tratamento" que torna o indicador alcançável.

## Technical Context

**Language/Version**: TypeScript 5.x strict; backend Next.js 15 App Router (raiz); frontend Vite +
TanStack Start (`frontend/`).

**Primary Dependencies**: NextAuth v5, Prisma 5.x, Zod 3.x, Tailwind CSS v4, shadcn/ui, React Query.
**Nenhuma dependência nova.**

**Storage**: PostgreSQL (Neon) via Prisma. Duas migrations novas, aplicadas manualmente com
`prisma migrate deploy` (o build da Vercel só roda `prisma generate`).

**Testing**:
- backend: `npm test` (Vitest, Prisma mockado; baseline de 367 testes na 008);
- frontend: `npx tsc --noEmit` + `npm run build` (não há runner de teste no frontend);
- banco real: ensaio no branch do Neon com `migrate status`, `migrate diff --exit-code` e o
  verificador read-only `scripts/verify-009-migration.ts`.

**Target Platform**: Vercel (backend e frontend na mesma origem), Neon sa-east-1.

**Project Type**: Web, com dois apps no mesmo repositório (§3 do `CLAUDE.md`).

**Performance Goals**: nenhuma meta nova. As consultas novas são um `EXISTS` coberto pelos índices de
`CuidadoPlanejado` e filtros por `organizacaoId`, sobre dezenas de linhas por ONG.

**Constraints**:
- `DISPONIVEL` continua sendo o único status público (RF-005).
- Nenhum dado de LT ou de tratamento sai fora da gestão (RF-015).
- XOR do responsável.
- Migrations antes do merge (Clarification 2).
- A IA não manuseia `DATABASE_URL`.
- Bancos isolados: o desenvolvimento usa o branch Neon `dev-009` desde a primeira tarefa, porque o
  `.env` local apontava para o mesmo Neon da produção. O seed roda só no `seed-009` (descartável), o
  ensaio no `validacao-009` e o backup da virada fica no `pre-009`. A produção só recebe migration na
  virada (quickstart §0.1, §4 e §5).
- Prazo: 06/11/2026.

**Scale/Scope**:
- Backend: 2 migrations; 1 model e 1 enum novos; 1 módulo de regra; 5 arquivos de rota novos
  (8 handlers) e 5 contratos alterados.
- Frontend: 3 rotas novas e 6 telas ou componentes alterados.
- Seed: ajustado, 37 animais.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Pré-Phase 0 | Pós-Phase 1 (design) |
|---|---|---|
| **I. Zero over-engineering** | ✅ | ✅ Três abstrações novas, cada uma usada em ≥2 lugares concretos. `resolveFosterState` e `FOSTER_RESET_ON_ADOPTION` atendem `createAnimal`, `updateAnimal`, `updateAnimalStatus` e `completeAdoption`. `inTreatmentWhere` atende lista, filtro e dashboard. `AnimalIndicators` atende lista e detalhe. Nenhuma camada, repository ou factory |
| **II. Schema first** | ✅ | ✅ Tudo começa em `prisma/schema.prisma` e vira migration Prisma. **Nota:** a migration 1 leva um `UPDATE` escrito à mão **dentro** da migration Prisma versionada (R1), como na `20260811210000_perfis_publicos` da 006. Não há SQL em código de aplicação nem migration fora do Prisma. As invariantes ficam **sem** `CHECK` manual, para o banco não divergir do schema (R2) |
| **III. Server-side by default** | ✅ | ✅ Regras de LT, reset, derivação de tratamento, filtros e autorização ficam no backend. O frontend só esconde campos, omite os de LT quando o status é `ADOTADO` e filtra a lista de LTs por texto (estado de UI) |
| **IV. Proactive security** | ✅ | ✅ As rotas novas usam `requireActiveResponsible()` (`getServerSession`) antes de qualquer acesso. Acolhedor recebe 403; LT de outra ONG recebe 404 indistinguível. `organizacaoId` vem só da sessão. Dados do tutor nunca cruzam fronteira pública ou de adotante, com teste de regressão de privacidade |
| **V. Two-layer validation** | ✅ | ✅ Schemas Zod espelhados: `lib/schemas/lar-temporario.ts` ↔ `frontend/src/lib/schemas/larTemporario.ts`, com os validadores da 007 dos dois lados. `animalInputSchema` é estendido nos dois. A regra condicional fica no servidor |
| **VI. Minimal client state** | ✅ | ✅ As mutações usam o contrato HTTP protegido via `apiRequest` (camada `frontend/src/lib/data`). O filtro textual da lista de LT é estado transitório de UI |
| **VII. No unnecessary dependencies** | ✅ | ✅ Nenhuma. shadcn (Dialog, Select, Checkbox, Badge), Zod e Prisma cobrem tudo |
| **VIII. TypeScript strict** | ✅ | ✅ Tipos vêm de `@prisma/client` (`SituacaoLT`, `Prisma.AnimalWhereInput`, `Prisma.AnimalGetPayload`). Sem `any`. Remover `RESGATADO` quebra no compilador os `Record<StatusAnimal, …>` (`statusInitial`, `StatusBadge`, labels), o que é desejado |
| **IX. Test-first (critical paths)** | ✅ | ✅ Os testes [TEST-FIRST] de R10 cobrem a autorização e o isolamento entre ONGs (API de LT), as transições com efeito (reset nos três caminhos, vincular e desvincular, excluir) e as regras condicionais (`resolveFosterState`) |

**Resultado:** sem violações. Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/009-lar-temporario-status/
|-- GRILLING-BRIEF.md     # entrada da sabatina (D1–D9)
|-- spec.md               # promessa (+ Clarifications)
|-- ENTREGA.md            # fato (preenchido por onda)
|-- plan.md               # este arquivo
|-- research.md           # Phase 0
|-- data-model.md         # Phase 1
|-- quickstart.md         # Phase 1: ensaio Neon, homologação, virada
|-- contracts/
|   `-- http-contracts.md # Phase 1
`-- tasks.md              # 98 tarefas (montado pelo agente com autorização do Pedro)
```

### Source Code (arquivos reais tocados)

```text
prisma/
|-- schema.prisma                                   # StatusAnimal, SituacaoLT, Animal, LarTemporario, Organizacao
|-- migrations/<ts1>_status_sem_resgatado/          # novo (UPDATE + troca de enum)
|-- migrations/<ts2>_lar_temporario/                # novo (gerado, sem edição)
`-- seed.ts                                         # LTs, situacaoLT em ciclo, Seninha
scripts/verify-009-migration.ts                     # novo, read-only

lib/
|-- lar-temporario.ts                               # novo: resolveFosterState, FOSTER_RESET_ON_ADOPTION, inTreatmentWhere
|-- schemas/animal.ts                               # + situacaoLT?, larTemporarioId?
|-- schemas/lar-temporario.ts                       # novo
|-- schemas/dashboard-filters.ts                    # + lt, tratamento
|-- actions/animais.ts                              # createAnimal, updateAnimal, updateAnimalStatus
|-- actions/solicitacoes.ts                         # completeAdoption (reset no mesmo updateMany)
|-- actions/lares-temporarios.ts                    # novo: criar, editar, excluir, vincular, desvincular
|-- queries/owned-animals.ts                        # select, DTO e filtros novos
|-- queries/operational-dashboard.ts                # statusInitial sem RESGATADO; 3 indicadores
`-- queries/lares-temporarios.ts                    # novo: lista, detalhe, vinculáveis
app/api/
|-- animais/gerenciados/route.ts                    # GET: lt de acolhedor → 400
|-- animais/gerenciados/[id]/route.ts               # sem mudança de código (DTO muda na query)
|-- lares-temporarios/route.ts                      # novo: GET, POST
|-- lares-temporarios/vinculaveis/route.ts          # novo: GET
|-- lares-temporarios/[id]/route.ts                 # novo: GET, PATCH, DELETE
|-- lares-temporarios/[id]/animais/route.ts         # novo: POST
`-- lares-temporarios/[id]/animais/[animalId]/route.ts  # novo: DELETE

frontend/src/
|-- lib/domain/enums.ts                             # − RESGATADO; + SituacaoLT, labels, ajuda por status
|-- lib/domain/types.ts                             # DTOs de LT e campos novos do animal
|-- lib/schemas/animal.ts                           # − RESGATADO; + campos de LT
|-- lib/schemas/larTemporario.ts                    # novo
|-- lib/schemas/registroSaude.ts                    # + medicamento/tratamento
|-- lib/data/animais.ts                             # filtros lt/tratamento; DTO
|-- lib/data/dashboard.ts                           # indicadores novos
|-- lib/data/lares-temporarios.ts                   # novo
|-- lib/data/saude.ts, lib/data/cuidados.ts         # dataProxima em MEDICAMENTO_TRATAMENTO
|-- components/app/StatusBadge.tsx                  # − RESGATADO
|-- components/app/AnimalIndicators.tsx             # novo: badges de tratamento/LT
|-- components/app/AnimalForm.tsx                   # selects de LT, ajuda do status, omissão em ADOTADO
|-- components/app/HealthPanel.tsx                  # + TratamentoForm
|-- routes/_authenticated.dashboard.tsx             # item de menu só para ORGANIZACAO
|-- routes/_authenticated.dashboard.index.tsx       # 3 cards
|-- routes/_authenticated.dashboard.animais.index.tsx   # validateSearch, filtros, badges
|-- routes/_authenticated.dashboard.animais.$animalId.tsx  # badges
|-- routes/_authenticated.dashboard.saude.index.tsx # CompletionForm: próxima dose
|-- routes/_authenticated.dashboard.lares-temporarios.tsx        # novo (Outlet)
|-- routes/_authenticated.dashboard.lares-temporarios.index.tsx  # novo
|-- routes/_authenticated.dashboard.lares-temporarios.$larId.tsx # novo
`-- routeTree.gen.ts                                # regenerado e COMMITADO (rotas novas)

__tests__/                                          # ver research R10
```

**Structure Decision**: mantém o split backend (raiz) / frontend (`frontend/`) da §3 do `CLAUDE.md`
e da constituição, sem refactor. As rotas novas seguem o padrão de `animais/gerenciados`: a rota
valida o corpo, a action aplica a regra e a query monta o DTO. `legacy/` não é tocado.

## Ondas de implementação (para o Pedro montar o `tasks.md`)

Uma branch, `009-lar-temporario-status`, com **um commit por onda**. Cada commit passa pelo portão
(quickstart §0) e é registrado no `ENTREGA.md` com o hash. A §2 do `CLAUDE.md` explica por que a
fronteira backend/frontend não pode ficar quebrada entre commits. Por isso, cada onda que muda um
contrato leva backend e frontend juntos.

| Onda | Conteúdo | Requisitos | Testes [TEST-FIRST] | Depende de |
|---|---|---|---|---|
| **0** | Schema e migration 1: remover `RESGATADO`; corrigir todos os usos no backend, no frontend (`enums.ts`, `schemas/animal.ts`, `StatusBadge.tsx`) e nos testes (fixtures); texto de ajuda do status no `AnimalForm` | D1, D2, RF-001 a RF-005 | fixtures atualizadas; `tsc` pega os `Record<StatusAnimal>` | — |
| **1** | Schema e migration 2; `lib/lar-temporario.ts`; `animalInputSchema`; `createAnimal`, `updateAnimal`, `updateAnimalStatus`, `completeAdoption`; DTO de gestão com `situacaoLT`/`larTemporario`; `verify-009-migration.ts` | RF-009 a RF-013a, C5 a C7 | `lar-temporario.test.ts`; reset em `animais.test.ts` e `solicitacoes.test.ts` (CA-03, CA-04) | 0 |
| **2** | API de LT (5 arquivos de rota, actions e queries) | RF-020 a RF-026, C1 a C4 | `api/lares-temporarios.test.ts` (CA-05 a CA-07) | 1 |
| **3** | Privacidade: `lt-privacy.test.ts` (regressão) | RF-015 | `lt-privacy.test.ts` (CA-01, parte pública) | 1 |
| **4** | "Em tratamento": `inTreatmentWhere`; DTO `emTratamento`; filtros `lt`/`tratamento` (+400 para acolhedor); 3 indicadores no dashboard | RF-006, RF-007, RF-016 a RF-019 | `owned-animals.test.ts`, `dashboard-filters.test.ts`, `operational-dashboard.test.ts`, `owner-animals.test.ts` (CA-08) | 1 |
| **5** | Frontend da gestão do animal: `AnimalForm` (selects, aviso, omissão em `ADOTADO`), `AnimalIndicators`, lista com `validateSearch` e filtros, detalhe, cards do dashboard | RF-014, RF-016 a RF-019, C12 a C17 | portão do frontend | 1, 4 |
| **6** | Frontend da aba "Lares temporários" (3 rotas, menu, explicação para acolhedor) e `routeTree.gen.ts` | RF-020 a RF-025, C18 | portão do frontend | 2 |
| **7** | Saúde: `TratamentoForm` com a dica; "Próxima dose" no `CompletionForm` | RF-008, C9 | portão do frontend | — |
| **8** | Seed (2 LTs, ciclo de `situacaoLT`, Seninha) | RF-027, C19 | `prisma:seed` em banco local ou branch vazio | 1 |
| **9** | Ensaio no branch Neon `validacao-009` e homologação H1 a H13 (quickstart §2 e §3); registro no `ENTREGA.md` | CA-01 a CA-09 | — | 0 a 8 |
| **10** | PR; virada em produção na ordem obrigatória (quickstart §4); atualização do `ENTREGA.md`, do `specs/README.md`, do §10 do `CLAUDE.md` (status, LT, 37 animais no seed) e do `AGENTS.md` | D9, Clarification 2 | smoke em produção | 9 |

**Paralelizáveis:** 2, 3, 4 e 8 depois da 1; a 7 é independente.
**Caminho crítico até o prazo (06/11):** 0 → 1 → 4 → 5 → 9 → 10.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| App local ou migration rodando contra a produção durante o desenvolvimento (o `.env` apontava para o mesmo Neon) | Branch `dev-009` como primeira tarefa, com o script de conferência de host do quickstart §0.1 antes de cada `migrate deploy` |
| Seed apagando dados reais | Seed só no branch descartável `seed-009` (quickstart §5) |
| Cópias de dados reais esquecidas no Neon (`dev-009`, `validacao-009`, `pre-009`) | Tarefas de exclusão: `validacao-009` depois da homologação; `pre-009` e `dev-009` 7 dias depois da virada |
| Código na `main` antes da migration → vitrine com 500 | Ordem obrigatória do quickstart §4; o PR só é mergeado depois do verificador em produção |
| A migration 1 falha por linha `RESGATADO` não convertida | O `UPDATE` vem antes do `ALTER … USING` na mesma transação, e o ensaio no branch prova a ordem |
| Drift entre o schema e o banco | `migrate diff --from-url … --exit-code` no branch e na produção |
| Um quarto caminho até `ADOTADO` surge depois | O reset vive num módulo único; anotado em "Para quem vier depois" |
| Vazamento de LT em consulta nova de adotante | `lt-privacy.test.ts` falha se alguém trocar `select` por `include` |
| Cards do dashboard não filtravam (defeito pré-existente) | `validateSearch` na lista (Onda 5), necessário para o RF-019 |
| Branch de validação com cópia de dados reais esquecido no Neon | Apagar o `validacao-009` depois da homologação (quickstart §3) |

## Complexity Tracking

Não se aplica: o Constitution Check não tem violações. A nota sobre o `UPDATE` dentro da migration
Prisma está registrada no princípio II, com precedente na 006.

## Para quem vier depois

- `updateAnimalStatus` (`lib/actions/animais.ts:201`) não tem rota HTTP. Recebeu a regra de reset por
  segurança; removê-lo é limpeza fora desta spec.
- Os cards antigos do dashboard (`?status=…`) só passam a filtrar com a Onda 5. Antes dela, o link já
  existia e não filtrava.
- Os campos de `LarTemporario` são **provisórios** até o formulário da Cia Animal. Acrescentar campo é
  migration aditiva.
