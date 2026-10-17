# Data model — Spec 011

**Nenhuma entidade persistida muda.** Sem `prisma/schema.prisma`, sem migration (D3). O contrato HTTP
consumido é o mesmo de hoje (`OperationalDashboard`, em `frontend/src/lib/data/dashboard.ts`).

O que esta spec cria são **tipos de apresentação** (view-model), derivados do contrato no cliente, em
`frontend/src/lib/dashboard-visual.ts`. Não carregam dado novo (SC-01): só reorganizam, rotulam e
calculam proporções.

## Tom (`Tone`)

```ts
type Tone = "primary" | "neutral" | "accent" | "destructive" | "warning" | "information" | "success";
```

Cada tom corresponde a um par de classes de token (chip `bg-<tom>-muted text-<tom>-muted-foreground`,
`neutral` = `bg-muted text-muted-foreground`, `accent` = `bg-accent text-accent-foreground`). O mapa
tom → classes vive no componente, não no módulo puro.

## Card de indicador

```ts
type IndicatorKey =
  | "availableAnimals" | "animalsInCare" | "animalsInAdoptionProcess" | "requestsWaitingReview"
  | "overdueHealthCare" | "next7DaysHealthCare" | "animalsInTreatment"
  | "animalsSeekingFoster" | "animalsInFosterUnregistered";

interface IndicatorCard {
  key: IndicatorKey;
  label: string;          // texto de hoje ("Disponíveis", "Cuidados atrasados", …)
  count: number;          // DashboardIndicator.count
  href: string;           // resolveHref(DashboardIndicator.href)  (D8)
  tone: Tone;             // RF-IND-03
  requiresAction: boolean; // C4: key ∈ {overdueHealthCare, requestsWaitingReview,
                           //      animalsInFosterUnregistered} && count > 0
}
```

## Grupo de indicadores

```ts
type GroupId = "adocao" | "saude" | "lt";

interface IndicatorGroup {
  id: GroupId;
  title: "Adoção" | "Saúde" | "Lar temporário";
  tone: "primary" | "information" | "brand"; // cor do ícone do título (C3)
  cards: IndicatorCard[];
}
```

**Regras:**
- Ordem dos grupos: adocao → saude → lt. Ordem dos cards: a de hoje (C2).
- O grupo `lt` só existe se **os dois** campos opcionais vierem no JSON (hoje vêm juntos, só para
  ONG). Se só um vier, o grupo traz só esse card. Se nenhum vier, o grupo não existe (D7).

## Pendências visíveis

```ts
interface VisiblePriorities {
  visible: DashboardPriorityItem[]; // os 5 primeiros, ou todos se expandido
  hiddenCount: number;              // total - 5 quando recolhido; 0 se expandido ou total ≤ 5
}
```

Marcação por `PriorityKind` (tom + etiqueta) em RF-PEN-03.

## Fatia de status

```ts
interface StatusSlice {
  status: StatusAnimal;   // ordem fixa: EM_CUIDADOS, DISPONIVEL, EM_PROCESSO_ADOCAO, ADOTADO
  label: string;          // statusAnimalLabel
  count: number;
  fraction: number;       // count / total; 0 quando total = 0 (sem divisão por zero)
  percent: number;        // Math.round(fraction * 100), só para a legenda
  href: string;           // "/dashboard/animais?status=<status>"
}
```

A largura do segmento usa `fraction` (exata); a legenda usa `percent` (arredondado, pode não somar
100 — aceitável, é texto informativo).

## Linha do funil

```ts
interface FunnelRow {
  key: "inAnalysis" | "approvedOrInProcess" | "completedInPeriod";
  label: "Em análise" | "Aprovadas / em processo" | "Concluídas no período";
  value: number;
  widthPercent: number;   // 0 se value = 0; senão max(4, value / maior * 100)
  tone: "primary" | "success";
}
```

## Estados

| Estado | Origem | Exibição |
|---|---|---|
| Carregando | `isLoading` da query | esqueleto (C8) |
| Erro | `isError` | `Alert` + "Tentar de novo" (C8) |
| Pendências vazias | `priorityItems.length === 0` | RF-PEN-04 |
| Animais total 0 | soma de `animalStatusCounts` = 0 | RF-STA-03 |
| Funil zerado | os três = 0 | RF-FUN-03 |
| Atividade vazia | `recentActivity.length === 0` | seção some (RF-ATV-01) |
