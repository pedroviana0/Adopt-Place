# Entrega — Spec 010: Correção de fuso horário nas datas de saúde

| | |
|---|---|
| **Período** | 2026-10-14 |
| **Branch** | `010-correcao-fuso-horario` (aberta a partir de `008-correcoes-upload-triagem`, `f52d99c`) |
| **PRs** | #135 (merge `69475b7`) |
| **Status** | **ENTREGUE** — homologado pelo mantenedor em 2026-10-14 |
| **Spec** | [`spec.md`](spec.md) |

## 1. O que a spec promete

| Item | Estado |
|---|---|
| R1 — utilitário único de datas no frontend, fuso `America/Sao_Paulo` | Feito |
| R2 — troca de todos os usos (`toISOString().slice(`, `new Date("AAAA-MM-DD")`) | Feito |
| R3 — conferência do backend | Feito; nada a corrigir no fuso (ver §3 e §4) |
| R4 — sem schema, migration ou mudança de contrato | Respeitado (a API continua recebendo ISO) |
| R5 — testes unitários do utilitário | Feito: `__tests__/frontend/date.test.ts`, 9 testes |
| CA-01 a CA-03 — homologação manual | Homologado pelo mantenedor (2026-10-14); CA-03 com a redação revista |
| CA-04 — `npm test`, `tsc`, lint | Ver §2 |

## 2. O que foi entregue

**Diagnóstico confirmado no código.** Os três itens da spec procedem:

1. `toIso()` (`HealthPanel.tsx`) e `toIsoDate()` (Central de Saúde) faziam `new Date("AAAA-MM-DD")`,
   que é meia-noite UTC = 21h do dia anterior em Brasília. A exibição com `toLocaleDateString`
   mostrava um dia antes.
2. `min` dos `datetime-local` vinha de `toISOString().slice(0, 16)`, 3h adiantado; `hoje`/`max` dos
   `date`, de `toISOString().slice(0, 10)`, que a partir das 21h já é o dia seguinte.
3. O frontend não tinha equivalente a `lib/date-utils.ts`.

**Mudanças:**

- `frontend/src/lib/date.ts` (novo): `hojeLocal`, `agoraLocal`, `dataInputParaIso`,
  `dataHoraInputParaIso`, `formatarData`, `formatarDataHora`, `formatarDataExtenso`. Tudo via
  `Intl` com `timeZone: "America/Sao_Paulo"`, sem depender do fuso do navegador nem do servidor de
  SSR. A conversão "relógio de Brasília → instante" usa o mesmo ajuste iterativo de
  `lib/date-utils.ts`.
- `HealthPanel.tsx` e `_authenticated.dashboard.saude.index.tsx`: helpers locais removidos, todos os
  usos trocados pelo utilitário. A agenda passou a mostrar **data e hora** do cuidado planejado
  (antes só a data — sem isso CA-02 "o painel mostra 23h30" não tinha como ser verificado).
- Demais exibições de data do painel trocadas por `formatarData`/`formatarDataHora`/
  `formatarDataExtenso`: dashboard, mensagens (lista e conversa), solicitações (lista, detalhe e
  "minhas"), documentos, adoções concluídas e admin de usuários.

**Validação (2026-10-14):**

- `__tests__/frontend/date.test.ts`: 9/9 aprovados, rodados com `TZ=UTC`, `TZ=America/Sao_Paulo`
  e `TZ=Asia/Tokyo` — o resultado não depende do fuso da máquina.
- `npm test`: 375 aprovados, **1 falha não relacionada**: `__tests__/seed/organization-search-seed.test.ts`
  abre um `PrismaClient` real (não usa o mock) e falha com `PrismaClientInitializationError` quando
  não há banco acessível.
- `npx tsc --noEmit`: backend e frontend aprovados.
- Build do frontend aprovado; `routeTree.gen.ts` intacto. ESLint limpo no teste novo; os avisos de
  Prettier restantes nos arquivos tocados são anteriores à 010.

## Registro de implementação

- Commit: `3b81ebf` (`fix: ancora datas do painel no fuso de Brasília (spec 010)`).

## 3. Decisões que não se reabrem

- **Data sem hora vai como meia-noite de Brasília, não meio-dia.** A spec sugeria meio-dia como
  aceitável, mas o backend valida `dataAplicacao` com `pastOrTodayDateSchema` (`date <= agora`, em
  `lib/schemas/common.ts`), reaplicado pelo `registroSaudeHttpSchema`. Meio-dia faria a vacina de
  "hoje" registrada de manhã voltar com "A data nao pode ser futura". Meia-noite local é sempre
  `<= agora` no próprio dia e, como exibição e classificação usam o mesmo fuso, não muda de dia.
- **"Atrasado" continua contado por dia, como na spec 002** (decisão do mantenedor, 2026-10-14).
  Um cuidado de hoje fica em "Hoje" mesmo depois do horário marcado; só vai para "Atrasadas" no
  dia seguinte. O CA-03 da `spec.md` foi reescrito para refletir isso. Mudar para "passou do
  horário" exigiria mexer em `classifyHealthDate` e em `plannedDateWhere`
  (`lib/queries/health-dashboard.ts`), e é decisão nova, não correção.
- **O contrato continua `toISOString()` (sufixo `Z`).** O backend aceita `datetime({ offset: true })`;
  o instante é o mesmo, então não houve motivo para trocar o formato.

## 4. O que a spec previa e não foi entregue / divergências

- **CA-03 divergia da spec 002** ("vencido há 1h" em "Atrasadas"). Resolvido a favor da 002; ver §3.
- **Dados já gravados errados** continuam aparecendo um dia antes (fora de escopo, por decisão).
- `frontend/src/lib/schemas/registroSaude.ts` ainda faz `new Date(v.dataRegistro)`, mas o schema
  **não é importado em lugar nenhum** (código morto). Não foi alterado.

## 5. Armadilhas descobertas

- O preview da Vercel do PR #135 falhou por um bloqueio de dependência, não pelo código: a Vercel
  recusa instalar TanStack Start com a CVE-2026-102989. O log só aparece logado na Vercel. O
  bloqueio saiu com o PR #134, e o deploy da `main` voltou a passar.

- `new Date("AAAA-MM-DD")` é UTC; `new Date("AAAA-MM-DDTHH:mm")` é **hora local do navegador**.
  O segundo parecia certo só porque a máquina de teste estava em Brasília.
- Qualquer "hoje" calculado com `toISOString()` vira o dia seguinte das 21h às 23h59 em Brasília.
- Ancorar data em meio-dia, receita comum para "não virar o dia", colide com validação de
  "não pode ser futura" feita no servidor.

## 6. Onde o código vive

- `frontend/src/lib/date.ts` — utilitário.
- `__tests__/frontend/date.test.ts` — testes (incluem cruzamento com `lib/date-utils.ts` e
  `pastOrTodayDateSchema` do backend).
- `frontend/src/components/app/HealthPanel.tsx`, `frontend/src/routes/_authenticated.dashboard.saude.index.tsx`.
- Backend conferido, sem alteração: `lib/date-utils.ts`, `lib/schemas/registro-saude.ts`,
  `lib/schemas/cuidado-planejado.ts`, `lib/schemas/common.ts`, `lib/queries/health-dashboard.ts`,
  `lib/queries/operational-dashboard.ts`.

## 7. Para quem vier depois

Toda data que sai de input ou vai para a tela passa por `@/lib/date`. Não use `toISOString().slice`,
`new Date("AAAA-MM-DD")` nem `toLocaleDateString` sem `timeZone` no frontend.
