import type {
  ActivityKind,
  DashboardPriorityItem,
  OperationalDashboard,
  PriorityKind,
} from "./data/dashboard";
import { statusAnimalLabel, type StatusAnimal } from "./domain/enums";

// ============================================================================
// Spec 011: view-model do painel de gestão. Só reorganiza, rotula e calcula
// proporções sobre o contrato de GET /api/dashboard/operacional; nenhum dado
// novo (SC-01). Sem React, para os testes de __tests__/frontend.
// ============================================================================

export type Tone =
  "primary" | "neutral" | "accent" | "destructive" | "warning" | "information" | "success";

export type IndicatorKey = keyof OperationalDashboard["indicators"];

export interface IndicatorCard {
  key: IndicatorKey;
  label: string;
  count: number;
  href: string;
  tone: Tone;
  requiresAction: boolean;
}

export type GroupId = "adocao" | "saude" | "lt";

export interface IndicatorGroup {
  id: GroupId;
  title: "Adoção" | "Saúde" | "Lar temporário";
  tone: "primary" | "information" | "brand";
  cards: IndicatorCard[];
}

export interface VisiblePriorities {
  visible: DashboardPriorityItem[];
  hiddenCount: number;
}

export interface StatusSlice {
  status: StatusAnimal;
  label: string;
  count: number;
  fraction: number;
  percent: number;
  href: string;
}

export type FunnelKey = keyof OperationalDashboard["adoptionFunnel"];

export interface FunnelRow {
  key: FunnelKey;
  label: "Em análise" | "Aprovadas / em processo" | "Concluídas no período";
  value: number;
  widthPercent: number;
  tone: "primary" | "success";
}

export const PRIORITY_VISIBLE_LIMIT = 5;
export const FUNNEL_MIN_WIDTH = 4;

// The backend derives drill-down hrefs assuming a dedicated agenda route; the
// current health surface lives at /dashboard/saude, so normalize that prefix.
export function resolveHref(href: string): string {
  return href.replace("/dashboard/saude/agenda", "/dashboard/saude");
}

// Re-exportados para os componentes não importarem de dois lugares.
export type { ActivityKind, PriorityKind };

// --- Pendências (US1) --------------------------------------------------------

// O backend já entrega em ordem de urgência (atrasados, hoje, solicitações,
// aprovadas): o corte não reordena.
export function visiblePriorities(
  items: DashboardPriorityItem[],
  expanded: boolean,
): VisiblePriorities {
  if (expanded || items.length <= PRIORITY_VISIBLE_LIMIT) {
    return { visible: items, hiddenCount: 0 };
  }
  return {
    visible: items.slice(0, PRIORITY_VISIBLE_LIMIT),
    hiddenCount: items.length - PRIORITY_VISIBLE_LIMIT,
  };
}

// Etiqueta escrita no frontend: tem acento, ao contrário dos títulos do backend.
export const priorityKindMeta: Record<PriorityKind, { tone: Tone; label: string }> = {
  SAUDE_ATRASADA: { tone: "destructive", label: "Atrasado" },
  SAUDE_HOJE: { tone: "warning", label: "Hoje" },
  SOLICITACAO_ANALISE: { tone: "primary", label: "Solicitação" },
  ADOCAO_APROVADA_CONCLUSAO: { tone: "success", label: "Concluir adoção" },
};

// --- Indicadores (US2) -------------------------------------------------------

const ACTION_KEYS: ReadonlySet<IndicatorKey> = new Set<IndicatorKey>([
  "overdueHealthCare",
  "requestsWaitingReview",
  "animalsInFosterUnregistered",
]);

export function requiresAction(key: IndicatorKey, count: number): boolean {
  return count > 0 && ACTION_KEYS.has(key);
}

const INDICATOR_META: Record<IndicatorKey, { label: string; tone: Tone }> = {
  availableAnimals: { label: "Disponíveis", tone: "primary" },
  animalsInCare: { label: "Em cuidados", tone: "neutral" },
  animalsInAdoptionProcess: { label: "Em processo de adoção", tone: "accent" },
  requestsWaitingReview: { label: "Solicitações aguardando análise", tone: "primary" },
  overdueHealthCare: { label: "Cuidados atrasados", tone: "destructive" },
  next7DaysHealthCare: { label: "Cuidados nos próximos 7 dias", tone: "warning" },
  animalsInTreatment: { label: "Em tratamento", tone: "information" },
  // Mesmas cores dos badges da 009 (AnimalIndicators).
  animalsSeekingFoster: { label: "Procurando LT", tone: "warning" },
  animalsInFosterUnregistered: { label: "Em LT sem registro", tone: "success" },
};

const GROUPS: { id: GroupId; title: IndicatorGroup["title"]; tone: IndicatorGroup["tone"]; keys: IndicatorKey[] }[] = [
  {
    id: "adocao",
    title: "Adoção",
    tone: "primary",
    keys: ["availableAnimals", "animalsInCare", "animalsInAdoptionProcess", "requestsWaitingReview"],
  },
  {
    id: "saude",
    title: "Saúde",
    tone: "information",
    keys: ["overdueHealthCare", "next7DaysHealthCare", "animalsInTreatment"],
  },
  {
    id: "lt",
    title: "Lar temporário",
    tone: "brand",
    keys: ["animalsSeekingFoster", "animalsInFosterUnregistered"],
  },
];

// Os indicadores de LT só chegam no JSON para organização (009, D6): o que não
// vem não vira card, e grupo sem card não existe (D7).
export function buildIndicatorGroups(
  indicators: OperationalDashboard["indicators"],
): IndicatorGroup[] {
  return GROUPS.map(({ keys, ...group }) => ({
    ...group,
    cards: keys.flatMap((key): IndicatorCard[] => {
      const indicator = indicators[key];
      if (!indicator) return [];
      return [
        {
          key,
          ...INDICATOR_META[key],
          count: indicator.count,
          href: resolveHref(indicator.href),
          requiresAction: requiresAction(key, indicator.count),
        },
      ];
    }),
  })).filter((group) => group.cards.length > 0);
}

// --- Status (US3) ------------------------------------------------------------

const STATUS_ORDER: StatusAnimal[] = ["EM_CUIDADOS", "DISPONIVEL", "EM_PROCESSO_ADOCAO", "ADOTADO"];

export function statusSlices(counts: Record<StatusAnimal, number>): StatusSlice[] {
  const total = STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0);
  return STATUS_ORDER.map((status) => {
    const fraction = total === 0 ? 0 : counts[status] / total;
    return {
      status,
      label: statusAnimalLabel[status],
      count: counts[status],
      fraction,
      percent: Math.round(fraction * 100),
      href: `/dashboard/animais?status=${status}`,
    };
  });
}

// --- Funil (US4) -------------------------------------------------------------

const FUNNEL_META: { key: FunnelKey; label: FunnelRow["label"]; tone: FunnelRow["tone"] }[] = [
  { key: "inAnalysis", label: "Em análise", tone: "primary" },
  { key: "approvedOrInProcess", label: "Aprovadas / em processo", tone: "primary" },
  { key: "completedInPeriod", label: "Concluídas no período", tone: "success" },
];

// Largura da barra do funil, em % do trilho. `max` é o maior dos três valores.
function funnelWidth(value: number, max: number): number {
  // TODO(human): devolver a largura conforme a C7 (escala relativa ao maior,
  // mínimo de FUNNEL_MIN_WIDTH para valor > 0, zero quando não há nada).
  void value;
  void max;
  return 0;
}

export function funnelRows(funnel: OperationalDashboard["adoptionFunnel"]): FunnelRow[] {
  const max = Math.max(funnel.inAnalysis, funnel.approvedOrInProcess, funnel.completedInPeriod);
  return FUNNEL_META.map(({ key, label, tone }) => ({
    key,
    label,
    tone,
    value: funnel[key],
    widthPercent: funnelWidth(funnel[key], max),
  }));
}

// --- Atividade (US5) ---------------------------------------------------------

export const activityKindTone: Record<ActivityKind, Tone> = {
  ANIMAL_CADASTRADO: "primary",
  SAUDE_REGISTRADA: "information",
  SOLICITACAO_RECEBIDA: "neutral",
  SOLICITACAO_APROVADA: "primary",
  ADOCAO_CONCLUIDA: "success",
};
