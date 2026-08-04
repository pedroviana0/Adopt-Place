import type { StatusCuidadoPlanejado, TipoCuidadoPlanejado } from "../domain/enums";
import { apiRequest } from "./api";

// ============================================================================
// Issue #55 (T098): Central de Saúde real over the HEALTH-CENTER-01 contract
// (app/api/saude/**). Ownership, the CONSULTA-not-history rule and completion
// idempotency are enforced by the backend; the frontend only consumes the
// documented contracts. Dates cross the boundary as ISO strings.
// ============================================================================

export type AgendaSituacao = "ATRASADO" | "HOJE" | "PROXIMO" | "CONCLUIDO" | "CANCELADO";

export interface HealthAgendaItem {
  id: string;
  animalId: string;
  tipo: TipoCuidadoPlanejado;
  status: StatusCuidadoPlanejado;
  dataHoraPlanejada: string;
  titulo: string;
  observacoes: string | null;
  localProfissional: string | null;
  origemRegistroSaudeId: string | null;
  animal: { id: string; nome: string };
  situacao: AgendaSituacao;
  animalHref: string;
}

export interface HealthOverview {
  groups: {
    overdue: HealthAgendaItem[];
    today: HealthAgendaItem[];
    next7Days: HealthAgendaItem[];
    next30Days: HealthAgendaItem[];
  };
  animalsWithoutHistory: { id: string; nome: string; href: string }[];
  positiveTests: {
    animalId: string;
    animalNome: string;
    disease: string;
    recordedAt: string;
    href: string;
  }[];
}

export async function fetchHealthOverview(): Promise<HealthOverview> {
  const data = await apiRequest<{ overview: HealthOverview }>("/api/saude/visao-geral", {
    method: "GET",
  });
  return data.overview;
}

export type AgendaSituacaoFilter =
  | "ATRASADO"
  | "HOJE"
  | "PROXIMO"
  | "PROXIMOS_7_DIAS"
  | "PROXIMOS_30_DIAS"
  | "CONCLUIDO"
  | "CANCELADO";

export interface AgendaFilters {
  animalId?: string;
  tipo?: TipoCuidadoPlanejado;
  situacao?: AgendaSituacaoFilter;
  from?: string;
  to?: string;
}

export async function fetchHealthAgenda(filters: AgendaFilters = {}): Promise<HealthAgendaItem[]> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  const data = await apiRequest<{ items: HealthAgendaItem[] }>(
    `/api/saude/agenda${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  return data.items;
}

export interface NovaConsulta {
  animalId: string;
  dataHoraPlanejada: string;
  titulo: string;
  observacoes?: string;
  localProfissional?: string;
}

export async function registrarConsulta(input: NovaConsulta): Promise<void> {
  await apiRequest("/api/saude/cuidados", { method: "POST", json: input });
}

export async function reagendarCuidado(id: string, dataHoraPlanejada: string): Promise<void> {
  await apiRequest(`/api/saude/cuidados/${id}`, {
    method: "PATCH",
    json: { dataHoraPlanejada },
  });
}

export async function cancelarCuidado(id: string): Promise<void> {
  await apiRequest(`/api/saude/cuidados/${id}`, {
    method: "DELETE",
    json: { confirmado: true },
  });
}

interface BaseConclusao {
  titulo?: string;
  observacoes?: string;
  profissionalClinica?: string;
}

// Completion payload for a clinical planned-care item — mirrors the backend
// registroSaudeHttpSchema (all five history categories). A CONSULTA is completed
// with no payload and never creates a health record.
export type ConclusaoCuidado =
  | (BaseConclusao & {
      tipoRegistro: "VACINA";
      nomeCustom: string;
      dataAplicacao: string;
      dataProximaDose?: string;
    })
  | (BaseConclusao & {
      tipoRegistro: "CONTROLE_PARASITAS";
      tipoMedicacao: string;
      frequencia: string;
      dataAplicacao: string;
      dataProxima?: string;
    })
  | (BaseConclusao & {
      tipoRegistro: "TESTE_DOENCA";
      nomeCustom: string;
      resultado: "POSITIVO" | "NEGATIVO";
      dataAplicacao: string;
      dataProxima?: string;
    })
  | (BaseConclusao & {
      tipoRegistro: "MEDICAMENTO_TRATAMENTO";
      medicamentoTratamento: string;
      dataAplicacao: string;
      dataProxima?: string;
    })
  | (BaseConclusao & {
      tipoRegistro: "PROCEDIMENTO";
      procedimento: string;
      dataAplicacao: string;
      dataProxima?: string;
    });

export async function concluirCuidado(id: string, payload?: ConclusaoCuidado): Promise<void> {
  await apiRequest(`/api/saude/cuidados/${id}/concluir`, {
    method: "POST",
    ...(payload ? { json: payload } : {}),
  });
}
