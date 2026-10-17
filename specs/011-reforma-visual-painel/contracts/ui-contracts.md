# Contratos — Spec 011

## 1. Contrato HTTP consumido (inalterado)

`GET /api/dashboard/operacional` → `{ dashboard: OperationalDashboard }`, tipado em
`frontend/src/lib/data/dashboard.ts`. **Nenhum campo novo, removido ou renomeado** (D2, D3, SC-01).
O painel continua sem ler `unreadMessages`.

## 2. Módulo puro `frontend/src/lib/dashboard-visual.ts`

Sem React, sem `fetch`, sem efeito. Testado em `__tests__/frontend/dashboard-visual.test.ts`.

```ts
export const PRIORITY_VISIBLE_LIMIT = 5;
export const FUNNEL_MIN_WIDTH = 4;

export function resolveHref(href: string): string;
// movida da rota, mesmo comportamento: "/dashboard/saude/agenda" → "/dashboard/saude"

export function buildIndicatorGroups(
  indicators: OperationalDashboard["indicators"],
): IndicatorGroup[];

export function requiresAction(key: IndicatorKey, count: number): boolean;

export function visiblePriorities(
  items: DashboardPriorityItem[],
  expanded: boolean,
): VisiblePriorities;

export const priorityKindMeta: Record<PriorityKind, { tone: Tone; label: string }>;
export const activityKindTone: Record<ActivityKind, Tone>;

export function statusSlices(counts: Record<StatusAnimal, number>): StatusSlice[];

export function funnelRows(funnel: OperationalDashboard["adoptionFunnel"]): FunnelRow[];
```

Tipos em [`../data-model.md`](../data-model.md).

## 3. Componentes `frontend/src/components/app/dashboard/`

Todos recebem dados por prop (nada de `useQuery` dentro), para o render estático do teste.

| Arquivo | Export | Props | Responde por |
|---|---|---|---|
| `OperationalDashboard.tsx` | `OperationalDashboard` | `{ data: OperationalDashboard }` | Ordem das seções (RF-EST-01), layout status + funil |
| `PriorityList.tsx` | `PriorityList` | `{ items: DashboardPriorityItem[] }` | RF-PEN-01..04; único `useState` (expandir) |
| `IndicatorGroups.tsx` | `IndicatorGroups` | `{ indicators: OperationalDashboard["indicators"] }` | RF-IND-01..04 |
| `StatusBar.tsx` | `StatusBar` | `{ counts: Record<StatusAnimal, number> }` | RF-STA-01..03 |
| `AdoptionFunnel.tsx` | `AdoptionFunnel` | `{ funnel: OperationalDashboard["adoptionFunnel"] }` | RF-FUN-01..03 |
| `RecentActivity.tsx` | `RecentActivity` | `{ items: DashboardActivity[] }` | RF-ATV-01..02 |
| `DashboardSkeleton.tsx` | `DashboardSkeleton` | — | C8 (carregando) |
| `tone.ts` | `toneChipClass`, `toneBorderClass`, `toneFillClass`, `groupIconClass` | — | Tom → classes de token (único lugar com nomes de classe de cor) |

A rota `_authenticated.dashboard.index.tsx` mantém `DashIndex` (sessão, ADMIN, query) e passa a
renderizar `<DashboardSkeleton />`, o `Alert` de erro com `refetch`, ou `<OperationalDashboard />`.

## 4. Classes de tom (`tone.ts`)

| Tom | Chip | Borda "Requer ação" | Preenchimento (barra) |
|---|---|---|---|
| `primary` | `bg-primary-muted text-primary-muted-foreground` | `border-primary` | `bg-primary` |
| `neutral` | `bg-muted text-muted-foreground` | — | `bg-muted-foreground` |
| `accent` | `bg-accent text-accent-foreground` | — | `bg-chart-2` |
| `destructive` | `bg-destructive-muted text-destructive-muted-foreground` | `border-destructive` | — |
| `warning` | `bg-warning-muted text-warning-muted-foreground` | — | — |
| `information` | `bg-information-muted text-information-muted-foreground` | — | — |
| `success` | `bg-success-muted text-success-muted-foreground` | `border-success` | `bg-success` |

Classes escritas por extenso (não montadas por template string), para o Tailwind v4 enxergá-las no
build.

## 5. Garantias verificáveis nos testes

- Organização (com os dois opcionais): 3 grupos, 9 cards, textos "Procurando LT" e "Em LT sem registro".
- Acolhedor (sem os opcionais): 2 grupos, 7 cards, **nenhum** texto "LT" / "Lar temporário".
- "Requer ação" aparece exatamente nos cards com `requiresAction` = true.
- Todo `href` de card = `resolveHref` do contrato; todo link da legenda = `/dashboard/animais?status=…`.
- Vazio: "Nada pendente no momento." sem "🎉"; "Nenhum animal cadastrado ainda."; "Nenhuma
  solicitação nos últimos 30 dias."; sem o título "Atividade recente".
- Nenhum `#` hexadecimal nem `rgb(` no HTML gerado.
