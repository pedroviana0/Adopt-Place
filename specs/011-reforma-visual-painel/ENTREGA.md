# Entrega — Spec 011: Reforma visual do painel de gestão

| | |
|---|---|
| **Período** | 2026-10-17 → (aberto) |
| **Branch** | `011-reforma-visual-painel` |
| **PRs** | — |
| **Status** | EM ANDAMENTO — spec aprovada na sabatina de 2026-10-17; Spec-Kit e código ainda não começaram |
| **Spec** | [`spec.md`](spec.md) |

Execução: Pedro, sozinho (D10). Só frontend, sem migration (D3).

## 1. O que a spec promete

| Onda | Conteúdo | Estado |
|---|---|---|
| 0 | Sabatina, `spec.md`, este `ENTREGA.md` e linha no índice | Concluída (`260f8ba`) |
| 1 | Spec-Kit (`plan.md`, `tasks.md`) | `plan.md` + artefatos concluídos (ver Onda 1); `tasks.md` em aberto |
| 2 | Testes vermelhos (`dashboard-visual`, `dashboard-render`) e tokens `-muted` novos | Em aberto |
| 3 | Extração do `Dashboard` e redesenho por seção (pendências, indicadores, status, funil, atividade, carregando/erro) | Em aberto |
| 4 | Portão (SC-04) e homologação H1–H12, com contraste medido | Em aberto |
| 5 | PR, merge e prints para a v21 e os slides | Em aberto |

## 2. O que foi entregue

### Onda 0 — abertura (2026-10-17, commit `260f8ba`)

- Sabatina das 13 questões abertas do [`GRILLING-BRIEF.md`](GRILLING-BRIEF.md), registradas como
  C1–C13 na `spec.md`.
- `spec.md`, este arquivo e a linha 011 em `specs/README.md`.

### Onda 1 — `/speckit-plan` (2026-10-17)

- `plan.md`, `research.md` (R1–R7), `data-model.md` (view-model, nada persistido),
  `contracts/ui-contracts.md` e `quickstart.md`; `AGENTS.md` aponta para o plano da 011.
- **C14** registrada na `spec.md`: `chart-2` dá 2,14:1 no claro; o 3:1 passou a valer para borda de
  "Requer ação" e foco, com barras e segmentos dispensados por terem equivalente em texto.
- Constitution Check: passa, sem violações.

## 3. Decisões que não se reabrem

- As da `spec.md` (D1–D10 e C1–C13). Em especial: mesmas informações (D2), só frontend (D3), cor do
  grupo × cor do estado (C3) e os 3 pares `-muted` novos em `styles.css` (C3, RF-TOK-01).

## 4. O que a spec previa e não foi entregue

Tudo além das Ondas 0 e 1 (plano), por enquanto.

## 5. Armadilhas descobertas

- **Na abertura, uma afirmação errada quase entrou na spec:** "o frontend não tem testes". O
  `frontend/` não tem runner próprio, mas o Vitest da raiz já testa código do frontend em
  `__tests__/frontend/`. Antes de declarar ausência de teste, procure os dois lugares.
- **O D5 do brief cita "variantes `-muted`" como se existissem para todas as cores.** Só `success`,
  `warning` e `information` têm. Os pares de `primary`, `destructive` e `brand` são criados nesta spec.

- **Alias `@/` no Vitest da raiz não quebra componentes do frontend** (medido, research R1): o
  `tsconfigPaths` resolve pelo `tsconfig` mais próximo de quem importa. A suspeita contrária custou um
  teste descartável; não precisa repetir.
- **Texto vermelho direto (`text-destructive`) falha no escuro (3,08:1).** No painel, erro e
  "Atrasado" usam o par `destructive-muted`.

## 6. Onde o código vive

Previsto (ver `spec.md`): `frontend/src/routes/_authenticated.dashboard.index.tsx`,
`frontend/src/components/app/dashboard/`, `frontend/src/lib/dashboard-visual.ts`,
`frontend/src/styles.css`, `__tests__/frontend/dashboard-*.test.ts`.

## 7. Para quem vier depois

- Depois do merge, refazer os prints do painel na documentação do TCC (v21) e nos slides da banca.
