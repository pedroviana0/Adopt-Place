import type { StatusAnimal } from "../domain/enums";
import { apiRequest } from "./api";

// ============================================================================
// Issue #56 (T099): operational dashboard over GET /api/dashboard/operacional.
// Owner-scoped metrics/funnel/pending/activity are computed by the backend; the
// frontend only consumes the documented contract. Dates arrive as ISO strings.
// ============================================================================

export interface DashboardIndicator {
  count: number;
  href: string;
}

export type PriorityKind =
  "SAUDE_ATRASADA" | "SAUDE_HOJE" | "SOLICITACAO_ANALISE" | "ADOCAO_APROVADA_CONCLUSAO";

export interface DashboardPriorityItem {
  id: string;
  kind: PriorityKind;
  title: string;
  subtitle: string;
  dueAt?: string;
  href: string;
}

export type ActivityKind =
  | "ANIMAL_CADASTRADO"
  | "SAUDE_REGISTRADA"
  | "SOLICITACAO_RECEBIDA"
  | "SOLICITACAO_APROVADA"
  | "ADOCAO_CONCLUIDA";

export interface DashboardActivity {
  id: string;
  kind: ActivityKind;
  label: string;
  occurredAt: string;
  href?: string;
}

export interface OperationalDashboard {
  indicators: {
    availableAnimals: DashboardIndicator;
    animalsInCare: DashboardIndicator;
    animalsInAdoptionProcess: DashboardIndicator;
    requestsWaitingReview: DashboardIndicator;
    overdueHealthCare: DashboardIndicator;
    next7DaysHealthCare: DashboardIndicator;
  };
  priorityItems: DashboardPriorityItem[];
  adoptionFunnel: {
    inAnalysis: number;
    approvedOrInProcess: number;
    completedInPeriod: number;
  };
  animalStatusCounts: Record<StatusAnimal, number>;
  recentActivity: DashboardActivity[];
  unreadMessages: number;
}

export async function fetchOperationalDashboard(): Promise<OperationalDashboard> {
  const data = await apiRequest<{ dashboard: OperationalDashboard }>("/api/dashboard/operacional", {
    method: "GET",
  });
  return data.dashboard;
}
