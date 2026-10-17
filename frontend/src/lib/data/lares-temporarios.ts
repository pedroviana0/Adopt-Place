import type { StatusAnimal } from "../domain/enums";
import type {
  LarTemporarioCreateInput,
  LarTemporarioUpdateInput,
} from "../schemas/larTemporario";
import { apiRequest, type ApiError } from "./api";

// Spec 009: gestao de lares temporarios sobre /api/lares-temporarios. So
// organizacao acessa; o backend escopa tudo pela organizacao da sessao.

export interface LarTemporarioDTO {
  id: string;
  nomeTutor: string;
  telefone: string;
  endereco: string;
  cidade: string;
  observacoes: string | null;
  totalAnimais: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AnimalVinculadoDTO {
  id: string;
  nome: string;
  status: StatusAnimal;
  fotoPrincipal: { urlFoto: string } | null;
}

export interface LarTemporarioDetailDTO extends LarTemporarioDTO {
  animais: AnimalVinculadoDTO[];
}

export async function fetchLaresTemporarios(): Promise<LarTemporarioDTO[]> {
  const data = await apiRequest<{ laresTemporarios: LarTemporarioDTO[] }>(
    "/api/lares-temporarios",
    { method: "GET" },
  );
  return data.laresTemporarios;
}

// 404 (inexistente ou de outra ONG) vira null: a tela mostra "nao encontrado"
// na hora, sem os retries do React Query (H12).
export async function fetchLarTemporario(id: string): Promise<LarTemporarioDetailDTO | null> {
  try {
    const data = await apiRequest<{ larTemporario: LarTemporarioDetailDTO }>(
      `/api/lares-temporarios/${id}`,
      { method: "GET" },
    );
    return data.larTemporario;
  } catch (e) {
    if ((e as ApiError).code === "NOT_FOUND") return null;
    throw e;
  }
}

export async function criarLarTemporario(input: LarTemporarioCreateInput): Promise<string> {
  const data = await apiRequest<{ larTemporario: { id: string } }>("/api/lares-temporarios", {
    method: "POST",
    json: input,
  });
  return data.larTemporario.id;
}

export async function atualizarLarTemporario(
  id: string,
  input: LarTemporarioUpdateInput,
): Promise<void> {
  await apiRequest(`/api/lares-temporarios/${id}`, { method: "PATCH", json: input });
}

export async function excluirLarTemporario(id: string): Promise<void> {
  await apiRequest(`/api/lares-temporarios/${id}`, { method: "DELETE" });
}

export async function fetchVinculaveis(): Promise<AnimalVinculadoDTO[]> {
  const data = await apiRequest<{ animais: AnimalVinculadoDTO[] }>(
    "/api/lares-temporarios/vinculaveis",
    { method: "GET" },
  );
  return data.animais;
}

export async function vincularAnimalLT(larTemporarioId: string, animalId: string): Promise<void> {
  await apiRequest(`/api/lares-temporarios/${larTemporarioId}/animais`, {
    method: "POST",
    json: { animalId },
  });
}

export async function desvincularAnimalLT(
  larTemporarioId: string,
  animalId: string,
): Promise<void> {
  await apiRequest(`/api/lares-temporarios/${larTemporarioId}/animais/${animalId}`, {
    method: "DELETE",
  });
}
