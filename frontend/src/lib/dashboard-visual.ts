import type {
  ActivityKind,
  DashboardPriorityItem,
  OperationalDashboard,
  PriorityKind,
} from "./data/dashboard";
import type { StatusAnimal } from "./domain/enums";

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
