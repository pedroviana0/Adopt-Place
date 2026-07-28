import type { SolicitacaoAdocao } from "../domain/types";
import type { StatusSolicitacao } from "../domain/enums";
import { loadDB, mutate } from "./db";
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

// ---- Mock helpers kept for the still-mock responsible-side flow (#45) ----

export function listSolicitacoes(): SolicitacaoAdocao[] {
  return loadDB()
    .solicitacoes.slice()
    .sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao));
}

export function listSolicitacoesPorResponsavel(responsavel: {
  organizacaoId?: string;
  acolhedorId?: string;
}): SolicitacaoAdocao[] {
  const db = loadDB();
  return listSolicitacoes().filter((s) => {
    const a = db.animais.find((x) => x.id === s.animalId);
    if (!a) return false;
    if (responsavel.organizacaoId) return a.organizacaoId === responsavel.organizacaoId;
    if (responsavel.acolhedorId) return a.acolhedorId === responsavel.acolhedorId;
    return false;
  });
}

export function getSolicitacao(id: string): SolicitacaoAdocao | undefined {
  return loadDB().solicitacoes.find((s) => s.id === id);
}

export type DecisaoSolicitacao = "APROVADA" | "RECUSADA";

export function decidirSolicitacao(
  id: string,
  decisao: DecisaoSolicitacao,
  observacoes?: string,
): void {
  mutate((db) => {
    const s = db.solicitacoes.find((x) => x.id === id);
    if (!s) throw new Error("Solicitação não encontrada");
    s.status = decisao;
    s.observacoes = observacoes ?? s.observacoes ?? null;
    s.dataAtualizacao = new Date().toISOString();

    if (decisao === "APROVADA") {
      // Recusa em cascata: demais EM_ANALISE do mesmo animal.
      db.solicitacoes.forEach((o) => {
        if (o.animalId === s.animalId && o.id !== s.id && o.status === "EM_ANALISE") {
          o.status = "RECUSADA";
          o.observacoes =
            (o.observacoes ?? "") + " Recusada automaticamente: outra solicitação foi aprovada.";
          o.dataAtualizacao = new Date().toISOString();
        }
      });
      const animal = db.animais.find((a) => a.id === s.animalId);
      if (animal) animal.status = "EM_PROCESSO_ADOCAO";
    }
    // Se RECUSADA, animal permanece DISPONIVEL — não muda nada além da própria.
  });
}

export function concluirAdocao(id: string): void {
  mutate((db) => {
    const s = db.solicitacoes.find((x) => x.id === id);
    if (!s) throw new Error("Solicitação não encontrada");
    if (s.status !== "APROVADA")
      throw new Error("Só é possível concluir uma solicitação aprovada.");
    s.status = "CONCLUIDA";
    s.dataAtualizacao = new Date().toISOString();
    const animal = db.animais.find((a) => a.id === s.animalId);
    if (animal) animal.status = "ADOTADO";
  });
}
