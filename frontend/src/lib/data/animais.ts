import type { Porte, Sexo, StatusAnimal } from "../domain/enums";
import { apiRequest } from "./api";

// --- Public showcase (Issue #27 / T040): real HTTP consumption ---
// These consume the public backend contracts (SHOWCASE-01) over the
// same-origin/proxy boundary. They do NOT touch the mock helpers above, which
// remain in use by the owner/dashboard and favorites flows (other Issues).

export interface PublicAnimalTag {
  key: string;
  label: string;
}

export interface PublicAnimalSummary {
  id: string;
  nome: string;
  porte: string;
  sexo: string;
  idadeEstimada: string | null;
  castrado: boolean;
  status: StatusAnimal;
  fotoPrincipal: string | null;
  especie: string | null;
  raca: string | null;
  cidade: string | null;
  responsavel: string | null;
  tags: PublicAnimalTag[];
}

export interface PublicAnimalDetail extends Omit<PublicAnimalSummary, "fotoPrincipal"> {
  cor: string | null;
  descricao: string | null;
  criadoEm: string;
  fotos: { id: string; urlFoto: string; principal: boolean }[];
  resumoSaude: { id: string; tipo: string; dataRegistro: string }[];
  relacionados: PublicAnimalSummary[];
}

export interface PublicMetrics {
  availableAnimals: number;
  completedAdoptions: number;
  responsibleParties: number;
}

export interface VitrineParams {
  especieId?: string;
  racaId?: string;
  porte?: string;
  sexo?: string;
  cidade?: string;
  tags?: string[];
  page?: number;
}

// Filter UI uses capitalized labels; the public API expects lowercase tag keys.
const TAG_KEYS: Record<string, string> = {
  Castrado: "castrado",
  Vacinado: "vacinado",
  Vermifugado: "vermifugado",
  Testado: "testado",
};

export async function fetchVitrine(params: VitrineParams = {}): Promise<{
  animals: PublicAnimalSummary[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.especieId) query.set("especieId", params.especieId);
  if (params.racaId) query.set("racaId", params.racaId);
  if (params.porte) query.set("porte", params.porte);
  if (params.sexo) query.set("sexo", params.sexo);
  if (params.cidade) query.set("cidade", params.cidade);
  const tags = (params.tags ?? []).map((t) => TAG_KEYS[t] ?? t.toLowerCase());
  if (tags.length > 0) query.set("tags", tags.join(","));
  query.set("page", String(params.page ?? 1));

  const res = await fetch(`/api/animais?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao carregar a vitrine");
  return res.json();
}

export async function fetchPublicAnimal(id: string): Promise<PublicAnimalDetail | null> {
  const res = await fetch(`/api/animais/${id}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Falha ao carregar o animal");
  return (await res.json()) as PublicAnimalDetail;
}

export async function fetchPublicMetrics(): Promise<PublicMetrics> {
  const res = await fetch("/api/metrics", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Falha ao carregar as métricas");
  return (await res.json()) as PublicMetrics;
}

// --- Owner animal management (Issues #40/#41): real HTTP over ---------------
// /api/animais/gerenciados. Owner identity comes from the session on the
// backend. Photo *upload* (adding new images) goes through Uploadthing and is
// deferred (recorded gap); these endpoints manage existing photos only.

export interface OwnedFoto {
  id: string;
  urlFoto: string;
  principal: boolean;
  ordem: number;
}

export interface OwnedAnimalSummary {
  id: string;
  nome: string;
  status: StatusAnimal;
  porte: Porte;
  sexo: Sexo;
  cor: string;
  idadeEstimada: string | null;
  castrado: boolean;
  especie: { id: string; nome: string };
  raca: { id: string; nome: string } | null;
  fotoPrincipal: OwnedFoto | null;
  solicitacoesEmAnalise: number;
}

export interface OwnedAnimalDetail extends OwnedAnimalSummary {
  descricao: string | null;
  criadoEm: string;
  fotos: (OwnedFoto & { criadoEm: string })[];
}

export interface AnimalInputDTO {
  nome: string;
  especieId: string;
  racaId: string | null;
  porte: Porte;
  sexo: Sexo;
  cor: string;
  idadeEstimada: string | null;
  castrado: boolean;
  descricao: string | null;
  status: StatusAnimal;
}

export interface OwnedAnimalFilters {
  q?: string;
  status?: string;
  especieId?: string;
  racaId?: string;
  porte?: string;
  sexo?: string;
}

export async function fetchAnimaisGerenciados(
  filters: OwnedAnimalFilters = {},
): Promise<OwnedAnimalSummary[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  const data = await apiRequest<{ animals: OwnedAnimalSummary[] }>(
    `/api/animais/gerenciados${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
  return data.animals;
}

export async function fetchAnimalGerenciado(id: string): Promise<OwnedAnimalDetail> {
  const data = await apiRequest<{ animal: OwnedAnimalDetail }>(`/api/animais/gerenciados/${id}`, {
    method: "GET",
  });
  return data.animal;
}

export async function criarAnimal(input: AnimalInputDTO): Promise<string> {
  const data = await apiRequest<{ animal: { id: string } }>("/api/animais/gerenciados", {
    method: "POST",
    json: input,
  });
  return data.animal.id;
}

export async function atualizarAnimalGerenciado(id: string, input: AnimalInputDTO): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}`, { method: "PATCH", json: input });
}

export async function excluirAnimal(id: string): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}`, { method: "DELETE" });
}

export async function reordenarFotos(
  id: string,
  photos: { id: string; ordem: number }[],
): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}/fotos`, { method: "PATCH", json: { photos } });
}

export async function definirFotoPrincipal(id: string, fotoId: string): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}/fotos/${fotoId}`, { method: "PUT" });
}

export async function excluirFoto(
  id: string,
  fotoId: string,
  novaPrincipalId?: string,
): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}/fotos/${fotoId}`, {
    method: "DELETE",
    json: novaPrincipalId ? { novaPrincipalId } : {},
  });
}

export interface RelacionamentoDTO {
  id: string;
  nome: string;
  status: StatusAnimal;
  fotoPrincipal: string | null;
}

export async function fetchRelacionamentos(id: string): Promise<RelacionamentoDTO[]> {
  const data = await apiRequest<{ relationships: RelacionamentoDTO[] }>(
    `/api/animais/gerenciados/${id}/relacionamentos`,
    { method: "GET" },
  );
  return data.relationships;
}

export async function vincularAnimal(id: string, animalRelacionadoId: string): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}/relacionamentos`, {
    method: "POST",
    json: { animalRelacionadoId },
  });
}

export async function desvincularAnimal(id: string, relatedId: string): Promise<void> {
  await apiRequest(`/api/animais/gerenciados/${id}/relacionamentos/${relatedId}`, {
    method: "DELETE",
  });
}
