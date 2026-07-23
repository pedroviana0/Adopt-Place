import type { SolicitacaoAdocao } from "../domain/types";
import { loadDB, mutate, uid } from "./db";

export function listSolicitacoes(): SolicitacaoAdocao[] {
  return loadDB().solicitacoes.slice().sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao));
}

export function listSolicitacoesPorAdotante(adotanteId: string): SolicitacaoAdocao[] {
  return listSolicitacoes().filter((s) => s.adotanteId === adotanteId);
}

export function listSolicitacoesPorResponsavel(
  responsavel: { organizacaoId?: string; acolhedorId?: string }
): SolicitacaoAdocao[] {
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

export function createSolicitacao(adotanteId: string, animalId: string): SolicitacaoAdocao {
  return mutate((db) => {
    const adot = db.adotantes.find((a) => a.id === adotanteId);
    if (!adot) throw new Error("Adotante não encontrado");
    if (!adot.triagemConcluida)
      throw new Error("Você precisa concluir a triagem antes de solicitar uma adoção.");
    const animal = db.animais.find((a) => a.id === animalId);
    if (!animal) throw new Error("Animal não encontrado");
    if (animal.status !== "DISPONIVEL")
      throw new Error("Este animal não está disponível para adoção.");
    const dup = db.solicitacoes.find(
      (s) => s.adotanteId === adotanteId && s.animalId === animalId &&
             (s.status === "EM_ANALISE" || s.status === "APROVADA")
    );
    if (dup) throw new Error("Você já tem uma solicitação ativa para este animal");
    const now = new Date().toISOString();
    const s: SolicitacaoAdocao = {
      id: uid("s"),
      animalId,
      adotanteId,
      status: "EM_ANALISE",
      dataSolicitacao: now,
      dataAtualizacao: now,
      observacoes: null,
    };
    db.solicitacoes.push(s);
    return s;
  });
}

export type DecisaoSolicitacao = "APROVADA" | "RECUSADA";

export function decidirSolicitacao(
  id: string,
  decisao: DecisaoSolicitacao,
  observacoes?: string
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
            (o.observacoes ?? "") +
            " Recusada automaticamente: outra solicitação foi aprovada.";
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
