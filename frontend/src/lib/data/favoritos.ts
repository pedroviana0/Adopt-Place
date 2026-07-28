import type { StatusAnimal } from "../domain/enums";
import type { PublicAnimalTag } from "./animais";
import { apiRequest } from "./api";

// Issue #33 (T058/T059): real adopter favorites over /api/favoritos. The mock
// localStorage implementation was removed; identity comes from the session on
// the backend (no browser-supplied adotanteId).

// The nested `animal` matches the public animal summary shape, so the favorites
// grid can reuse PublicAnimalCard.
export interface FavoritoAnimal {
  id: string;
  nome: string;
  status: StatusAnimal;
  idadeEstimada: string | null;
  especie: string | null;
  raca: string | null;
  porte: string;
  sexo: string;
  castrado: boolean;
  fotoPrincipal: string | null;
  responsavel: string | null;
  cidade: string | null;
  tags: PublicAnimalTag[];
}

export interface FavoritoDTO {
  animalId: string;
  criadoEm: string;
  animal: FavoritoAnimal;
}

export async function fetchFavoritos(): Promise<FavoritoDTO[]> {
  const data = await apiRequest<{ favorites: FavoritoDTO[] }>("/api/favoritos", { method: "GET" });
  return data.favorites;
}

// PUT adds, DELETE removes (backend derives the adopter from the session).
export async function setFavorito(animalId: string, favorited: boolean): Promise<void> {
  await apiRequest(`/api/favoritos/${animalId}`, { method: favorited ? "PUT" : "DELETE" });
}
