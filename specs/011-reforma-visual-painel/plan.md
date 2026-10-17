# Implementation Plan: Reforma visual do painel de gestão

**Branch**: `011-reforma-visual-painel` | **Date**: 2026-10-17 | **Spec**: [`spec.md`](spec.md)

**Input**: Feature specification from `specs/011-reforma-visual-painel/spec.md`

## Summary

Redesenhar o `/dashboard` de Organização e Acolhedor (direção B + A) sem mudar nenhuma informação: lista
de pendências no topo com marcação por tipo, indicadores em três grupos com cor por estado e "Requer
ação", status em barra empilhada com legenda clicável, funil em barras horizontais e atividade com
ícone por tipo. Tudo no frontend: um módulo puro de view-model (`lib/dashboard-visual.ts`), componentes
por seção em `components/app/dashboard/`, três pares de token `-muted` novos em `styles.css` e testes
no padrão de `__tests__/frontend/`.

## Technical Context

**Language/Version**: TypeScript 5.x strict. Só o app `frontend/` (React 19, TanStack Start/Router,
Vite). O backend Next.js 15 não muda.

**Primary Dependencies**: Tailwind CSS v4 (tokens em `@theme inline`), shadcn/ui (`Card`, `Skeleton`,
`Alert`, `Button`), `lucide-react@0.575.0`, React Query (query existente). Nenhuma dependência nova.

**Storage**: N/A — nenhuma mudança de schema ou migration.

**Testing**: Vitest 4 da raiz (`npm test`), em `__tests__/frontend/`, com `renderToStaticMarkup`
(verificado em research R1). `tsc --noEmit` nos dois apps e `npm run build` no frontend.

**Target Platform**: navegador (desktop e celular), temas claro e escuro.

**Project Type**: Web application (frontend do split da constituição).

**Performance Goals**: nenhuma requisição nova; o painel continua com uma única chamada
`GET /api/dashboard/operacional`. Sem biblioteca de gráfico (D4).

**Constraints**: mesmas informações (D2); só frontend (D3); só tokens (D5); WCAG AA conforme C14;
entrega antes de 01/11/2026 (D10).

**Scale/Scope**: 1 rota, ~8 arquivos novos de componente, 1 módulo puro, 1 arquivo de estilos, 2
arquivos de teste.

## Constitution Check

*Antes da Fase 0 e repetido depois da Fase 1: **passa**.*

| Princípio | Situação |
|---|---|
| I. Zero over-engineering | Um módulo puro (`dashboard-visual.ts`) e componentes por seção. Justificativa: a C11 exige lógica testável sem router e renderização por prop; nada genérico ou reaproveitado entre features. `tone.ts` existe porque o mesmo mapa tom → classe é usado por 4 componentes (cards, pendências, atividade, barras). |
| II. Schema first | Sem mudança de schema. |
| III. Server-side by default | Nenhuma regra de negócio vai ao cliente. O cliente só formata: rótulo, cor, proporção, corte em 5. As contagens e a classificação continuam no backend. |
| IV. Segurança proativa | Nenhum endpoint novo. A rota continua exigindo sessão (`_authenticated`) e a query segue restrita a ORGANIZACAO/ACOLHEDOR. |
| V. Validação em duas camadas | Sem entrada de usuário. |
| VI. Estado mínimo no cliente | Único estado novo: expandir/recolher pendências (`useState`, UI transitória). Sem mutação; "Tentar de novo" é `refetch()` da query existente. |
| VII. Sem dependências desnecessárias | Nenhuma. Gráficos com `div` + Tailwind (D4). |
| VIII. TypeScript strict | Tipos derivados do contrato `OperationalDashboard`; sem `any`. |
| IX. Test-first em caminho crítico | Não se aplica obrigatoriamente (UI, sem regra de autorização). Mesmo assim, a C11 manda escrever os testes antes e vê-los vermelhos. |

## Project Structure

### Documentation (this feature)

```text
specs/011-reforma-visual-painel/
|-- GRILLING-BRIEF.md
|-- spec.md
|-- ENTREGA.md
|-- plan.md              # este arquivo
|-- research.md          # Fase 0
|-- data-model.md        # Fase 1 (view-model; nada persistido)
|-- quickstart.md        # Fase 1
|-- contracts/
|   `-- ui-contracts.md  # Fase 1
`-- tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code

```text
frontend/src/
|-- routes/
|   `-- _authenticated.dashboard.index.tsx   # MUDA: só sessão/ADMIN/query/esqueleto/erro
|-- components/app/dashboard/                 # NOVO
|   |-- OperationalDashboard.tsx
|   |-- PriorityList.tsx
|   |-- IndicatorGroups.tsx
|   |-- StatusBar.tsx
|   |-- AdoptionFunnel.tsx
|   |-- RecentActivity.tsx
|   |-- DashboardSkeleton.tsx
|   `-- tone.ts
|-- lib/
|   `-- dashboard-visual.ts                   # NOVO (puro)
`-- styles.css                                # MUDA: 3 pares -muted (:root, .dark, @theme)

__tests__/frontend/
|-- dashboard-visual.test.ts                  # NOVO
`-- dashboard-render.test.ts                  # NOVO
```

**Não muda:** `app/`, `lib/` da raiz, `prisma/`, `package.json`/lockfiles, `frontend/src/lib/data/dashboard.ts`,
`routeTree.gen.ts` (nenhuma rota nova), `vitest.config.ts`.

**Structure Decision**: componentes de produto ficam em `components/app/` (convenção do §4 do
`CLAUDE.md`), numa subpasta por ser um conjunto de uma tela só. A lógica pura fica em `lib/`, ao lado de
`date.ts` e `animal-photo-input.ts`, que já são testados do mesmo jeito.

## Ordem de implementação (insumo para o `/speckit-tasks`)

1. **Tokens:** os 3 pares em `styles.css` (valores de research R2), nos dois temas e no `@theme`.
2. **Testes vermelhos:** `dashboard-visual.test.ts` (funções de `ui-contracts.md` §2) e
   `dashboard-render.test.ts` (garantias de §5), apontando para arquivos ainda inexistentes.
3. **Módulo puro** `dashboard-visual.ts` até os unitários passarem (`resolveHref` sai da rota para cá).
4. **Componentes** por seção + `tone.ts`, até o render test passar.
5. **Rota:** trocar o miolo por `OperationalDashboard`, `DashboardSkeleton` e `Alert` com `refetch`.
6. **Portão** (quickstart §3) e **homologação** H1–H12 (quickstart §5).
7. **Registro:** `ENTREGA.md`, índice, §10 do `CLAUDE.md`, PR.

## Riscos

| Risco | Mitigação |
|---|---|
| Borda `destructive` no escuro a 3,08:1 (limite) | H11 mede; se cair abaixo de 3:1 no render real, trocar por `border-destructive-muted-foreground` (research R3). |
| Classe Tailwind montada dinamicamente não entra no CSS | `tone.ts` com classes literais (ui-contracts §4); H8 confere visualmente. |
| Screenshot logo após navegar engana (009) | Esperar `document.getAnimations()`. |
| Mudança de comportamento ao extrair o componente | Render test cobre `href` de cards e textos; H1 clica em todos. |
| Prazo (D10) | Sem backend e sem migration; plano em 7 passos curtos. |

## Complexity Tracking

Nenhuma violação da constituição.
