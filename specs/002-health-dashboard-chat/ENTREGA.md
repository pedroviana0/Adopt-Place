# Entrega — Spec 002: Central de Saúde, Painel Operacional e Chat da Adoção

| | |
|---|---|
| **Período** | 2026-07-22 → 2026-07-23 |
| **Branch** | `002-health-dashboard-chat` |
| **PRs** | #13 |
| **Status** | **Entregue no backend em 2026-07-23; só chegou à interface oficial na spec 003** |
| **Spec** | [`spec.md`](spec.md) · plano em [`plan.md`](plan.md) · tarefas em [`tasks.md`](tasks.md) |

> **Leia isto antes de concluir qualquer coisa sobre a 002.** Ela foi entregue num único commit
> grande (`fb57ec0`) contra o frontend **antigo**, que dias depois foi arquivado em `legacy/`.
> Tudo que hoje se vê de Saúde, dashboard e chat na interface real foi (re)integrado pela **spec
> 003**. Procurar "a entrega da 002" só no histórico da 002 dá uma imagem incompleta.

---

## 1. O que a spec prometia

Feature incremental sobre a 001, preservando schema e contratos existentes. Três histórias:

| | História | Prioridade |
|---|---|---|
| US1 | Operar a Central de Saúde (agenda, registros, cuidados planejados, documentos) | P1 |
| US2 | Usar o Painel Operacional | P2 |
| US3 | Conversar após a aprovação da adoção | P2 |

Doze critérios de sucesso. Os que mais restringem o desenho: nenhuma tentativa não autorizada
acessa documento, ação de saúde, dado de dashboard ou conversa (SC-003); o perfil público do
animal não expõe documento, nota interna, dado de clínica nem item de agenda (SC-006); e uma
solicitação aprovada libera **exatamente uma** conversa, mesmo sob tentativas concorrentes
(SC-010).

## 2. O que foi entregue

- `fb57ec0` — **Central de Saúde, Painel Operacional e Chat da Adoção**, em um commit.
- A integração real com a interface oficial veio depois, na spec 003, em fatias rastreáveis:
  contrato HTTP da Central de Saúde (`5ab6757`), dashboard/documentos/chat no backend (`f26b35a`),
  alinhamento de tipos no frontend (`3d95247`), e então as telas: Central de Saúde (`3933061`),
  painel operacional (`35d0402`), documentos (`b59504d`) e chat (`e000276`).
- A 003 fechou a 002 formalmente em `0b54e59`, "certifica feature 002 ponta a ponta como frontend
  integrated", depois de auditá-la em `353002b`.

## 3. Decisões que não se reabrem

1. **Concluir uma CONSULTA não cria registro de histórico do tipo consulta.** A consulta vive na
   agenda, não no histórico clínico. Vale para qualquer relatório futuro de saúde.
2. **O chat só existe depois da aprovação**, e fica **somente leitura** depois da adoção concluída.
3. **Uma solicitação aprovada libera exatamente uma conversa** — a unicidade é garantida no
   servidor, não pela interface.
4. **Cuidado planejado derivado de "próxima data" aparece uma única vez** na agenda e na visão
   geral; duplicidade é defeito, não variação.

## 4. O que a spec previa e não saiu junto

Nada identificado como faltante nos requisitos. A dívida da 002 não foi de escopo, foi de
**forma**: entrega em bloco único, contra um frontend que seria descartado, sem contratos HTTP
documentados. Foi exatamente isso que motivou a spec 003 a começar por auditoria e matriz em vez
de código.

## 5. Armadilhas que nasceram aqui

- **Chat em tempo real não existe.** A decisão registrada é **polling**, e está fora de escopo
  mudar isso durante o TCC (`CLAUDE.md`, §10).
- O volume do commit único tornou impossível revisar a 002 por diff. É a origem prática da regra
  de granularidade que vale hoje: **uma branch por feature, commits pequenos dentro dela**.

## 6. Onde o código vive

`lib/queries/health-*.ts`, `health-records.ts`, `procedure-alerts.ts`, `documentos-saude.ts`,
`operational-dashboard.ts`, `mensagens.ts` · `app/api/saude/**`, `app/api/conversas/**`,
`app/api/mensagens/**`, `app/api/dashboard/**` · `frontend/src/routes/_authenticated.dashboard.saude.*`,
`...documentos.*`, `...mensagens.*`

## 7. Para quem vier depois

Ao mexer em saúde ou chat, confira o estado real na **matriz da 003**
(`specs/003-backend-frontend-integration/integration-matrix.md`) — é ela, e não a 002, que diz o
que está de fato integrado ponta a ponta.
