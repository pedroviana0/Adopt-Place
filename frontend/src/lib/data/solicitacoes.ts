import type { Adotante } from "../domain/types";
import type { StatusSolicitacao } from "../domain/enums";
import { apiRequest } from "./api";

// ============================================================================
// Issue #33 (T058/T059): real adopter-side requests over /api/solicitacoes.
// The responsible-side helpers below stay mock until their own flow (#45).
// ============================================================================

export interface AdopterRequestDTO {
  id: string;
  status: StatusSolicitacao;
  dataSolicitacao: string;
  dataAtualizacao: string;
  observacoes: string | null;
  animal: {
    id: string;
    nome: string;
    fotoPrincipal: string | null;
    responsavel: string | null;
  };
}

export async function fetchMinhasSolicitacoes(): Promise<AdopterRequestDTO[]> {
  const data = await apiRequest<{ requests: AdopterRequestDTO[] }>("/api/solicitacoes", {
    method: "GET",
  });
  return data.requests;
}

// Backend enforces screening-required, animal-availability and duplicate guards
// and returns a stable error code/message consumed by the caller.
export async function criarSolicitacao(animalId: string): Promise<void> {
  await apiRequest("/api/solicitacoes", { method: "POST", json: { animalId } });
}

// ============================================================================
// Issue #45 (T080/T081): real responsible-side request flows over
// /api/solicitacoes/gerenciadas. Ownership, cascade-refusal and status
// transitions are enforced by the backend; the frontend only consumes the
// documented contracts. Previous mock/localStorage helpers were removed.
// ============================================================================

// Screening block returned by the detail contract. Reuses the domain `Adotante`
// type so field names/optionality stay aligned to the backend DTO (which maps
// the Prisma column typos `todosConordamAdocao`/`ciendeNaoRepassar` back to the
// correct `todosConcordamAdocao`/`cienteNaoRepassar` at its boundary).
export type OwnerRequestAdotante = Pick<
  Adotante,
  | "id"
  | "nomeCompleto"
  | "telefone"
  | "cidade"
  | "estado"
  | "triagemConcluida"
  | "motivoAdocao"
  | "tipoAnimalDesejado"
  | "podeArcarCustosVet"
  | "adocaoParaPresente"
  | "adocaoParaPresenteDetalhe"
  | "tipoMoradia"
  | "moradiaPropria"
  | "numAdultosCasa"
  | "temCriancas"
  | "criancasFaixaEtaria"
  | "todosConcordamAdocao"
  | "condominioPermiteAnimal"
  | "janelasTeladas"
  | "acessoRua"
  | "murosSeguros"
  | "horasSozinho"
  | "responsavelViagem"
  | "planoEmGravidez"
  | "alergicosNaCasa"
  | "alergicosNaCasaDetalhe"
  | "planoMudanca"
  | "historicoDevolucao"
  | "historicoPercaDescuido"
  | "cienteLongevidade"
  | "permiteVisitaProtetor"
  | "cienteNaoRepassar"
  | "teveAnimaisAntes"
  | "animaisAnterioresDescricao"
  | "temOutrosAnimais"
  | "outrosAnimaisDescricao"
>;

export interface OwnerRequestListItem {
  id: string;
  status: StatusSolicitacao;
  dataSolicitacao: string;
  dataAtualizacao: string;
  animal: { id: string; nome: string };
  adotante: { nomeCompleto: string };
}

export interface OwnerRequestDetail {
  id: string;
  status: StatusSolicitacao;
  dataSolicitacao: string;
  dataAtualizacao: string;
  observacoes: string | null;
  animal: { id: string; nome: string };
  adotante: OwnerRequestAdotante;
}

export type DecisaoSolicitacao = "APROVADA" | "RECUSADA";

export async function fetchSolicitacoesGerenciadas(
  status?: StatusSolicitacao,
): Promise<OwnerRequestListItem[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiRequest<{ requests: OwnerRequestListItem[] }>(
    `/api/solicitacoes/gerenciadas${query}`,
    { method: "GET" },
  );
  return data.requests;
}

export async function fetchSolicitacaoGerenciada(id: string): Promise<OwnerRequestDetail> {
  const data = await apiRequest<{ request: OwnerRequestDetail }>(
    `/api/solicitacoes/gerenciadas/${id}`,
    { method: "GET" },
  );
  return data.request;
}

export async function decidirSolicitacao(
  id: string,
  decision: DecisaoSolicitacao,
  observacoes?: string,
): Promise<void> {
  await apiRequest(`/api/solicitacoes/gerenciadas/${id}`, {
    method: "PATCH",
    json: { decision, ...(observacoes ? { observacoes } : {}) },
  });
}

export async function concluirAdocao(id: string): Promise<void> {
  await apiRequest(`/api/solicitacoes/gerenciadas/${id}`, { method: "POST" });
}
