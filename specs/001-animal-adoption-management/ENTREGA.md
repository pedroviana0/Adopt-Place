# Entrega — Spec 001: Animal Adoption Management

| | |
|---|---|
| **Período** | 2026-05-24 → 2026-06-28 |
| **Branch** | `001-animal-adoption-management` |
| **PRs** | #1 a #12 |
| **Status** | **Entregue**, com uma pendência fechada só em 2026-08-07 (ver §4) |
| **Spec** | [`spec.md`](spec.md) · plano em [`plan.md`](plan.md) · tarefas em [`tasks.md`](tasks.md) |

> Esta é a spec fundadora. Ela criou o schema, os papéis, o ciclo de vida do animal e da
> solicitação — tudo que veio depois assume estas decisões. **Se você só puder ler uma spec
> antiga, leia esta.**

---

## 1. O que a spec prometia

Sistema web para o ciclo completo de animais resgatados, do acolhimento à adoção, em Volta
Redonda/RJ. Sete histórias:

| | História | Prioridade |
|---|---|---|
| US1 | Vitrine pública com filtros e página do animal, sem login | P1 |
| US2 | Cadastro de adotante e conclusão da triagem | P1 |
| US3 | Solicitar adoção e acompanhar o status | P1 |
| US4 | Gerir animais e histórico de saúde | P2 |
| US5 | Analisar e decidir solicitações | P2 |
| US6 | Consultar histórico de adoções e adotantes | P3 |
| US7 | Administrar usuários e acesso | P3 |

Dez critérios de sucesso (SC-001 a SC-010), com ênfase em: nenhuma página pública expõe dado
sensível de adotante ou dado interno da organização (SC-004), e 100% das tentativas de gerir
animal/solicitação de outro responsável são negadas (SC-006).

## 2. O que foi entregue

Por fases, cada uma um PR:

- **Fase 1** (`2d43fa9`) — schema Prisma, migrations, seed, estrutura base.
- **Fase 2** (`c2e531a`) — autenticação, guards, schemas Zod, layouts, base shadcn/ui.
- **Fase 3** (`526f563`) — vitrine pública, página do animal, home com métricas.
- **Fase 4** (`fff4fa4`) — cadastro e triagem.
- **Validação e regras** (`f5fbf5a`, `ebbeaa7`, `f3e30eb`, `1c898d1`) — schemas Zod, Server
  Actions, queries de leitura do adotante e do responsável, caminhos críticos e US3–US7.
- **Fotos e saúde** (`f42b8d4`) — ações de foto e de saúde, UI de gestão de animais.
- **Fechamento** (`ac50cd0`) — UI de US4–US7, páginas, rota de upload e acabamento.

Governança: a constituição subiu para **v1.1.0** em `c2adb54`, adicionando o **Princípio IX —
Test-First para caminhos críticos**, que é a origem da exigência de teste que existe até hoje.

## 3. Decisões que não se reabrem

Vieram das Clarifications de 2026-05-25 e valem para todo o produto:

1. **Estados canônicos.** Animal: `RESGATADO`, `EM_CUIDADOS`, `DISPONIVEL`, `EM_PROCESSO_ADOCAO`,
   `ADOTADO`. Solicitação: `EM_ANALISE`, `APROVADA`, `RECUSADA`, `CONCLUIDA`.
2. **Aprovar uma solicitação recusa automaticamente as demais em análise do mesmo animal.**
3. **Triagem única e padronizada** para todos os adotantes, editável a qualquer momento — não é
   customizável por organização.
4. **A página pública do animal mostra do responsável apenas nome público, cidade e tipo.**
   *A spec 006 amplia isso de forma controlada, acrescentando o identificador para permitir o link
   ao perfil — e nada mais.*
5. **Foto principal obrigatória**, com fotos adicionais ordenadas. *A spec 005 endureceu a regra:
   hoje são no mínimo 2 fotos para o animal ir a `DISPONIVEL`.*

## 4. O que a spec previa e não saiu junto

- **US6 (histórico de adoções concluídas, P3)** ficou em aberto por dois meses. Só foi fechada em
  2026-08-07, no commit `9e22063`, com a rota `/dashboard/adotados`.

## 5. Armadilhas que nasceram aqui

- **`lib/actions/*.ts` versus `app/api/**/route.ts`.** As Server Actions desta spec continuam no
  repositório, e em alguns casos a rota HTTP **reimplementa** a mesma regra em vez de chamar a
  action — `POST /api/solicitacoes` versus `createAdoptionRequest` é o caso conhecido. Ao
  acrescentar efeito colateral, instrumente a **rota HTTP**. Mexer só na action pode não ter
  efeito nenhum. Registrado no `CLAUDE.md`, §9.1.

## 6. Onde o código vive

`prisma/schema.prisma` · `lib/actions/` · `lib/queries/` · `lib/schemas/` · `app/api/**` ·
`__tests__/`

## 7. Para quem vier depois

O frontend desta spec **não é o frontend atual**. Ele foi arquivado em `legacy/` na spec 003 e
**não deve ser usado nem editado**. O que sobreviveu de 001 é o backend inteiro: schema, regras,
contratos e testes.
