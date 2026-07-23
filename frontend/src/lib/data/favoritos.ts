import type { Favorito } from "../domain/types";
import { loadDB, mutate } from "./db";

export function listFavoritos(adotanteId: string): Favorito[] {
  return loadDB().favoritos.filter((f) => f.adotanteId === adotanteId);
}

export function isFavorito(adotanteId: string, animalId: string): boolean {
  return loadDB().favoritos.some((f) => f.adotanteId === adotanteId && f.animalId === animalId);
}

export function toggleFavorito(adotanteId: string, animalId: string): boolean {
  return mutate((db) => {
    const idx = db.favoritos.findIndex((f) => f.adotanteId === adotanteId && f.animalId === animalId);
    if (idx >= 0) {
      db.favoritos.splice(idx, 1);
      return false;
    }
    db.favoritos.push({ adotanteId, animalId, criadoEm: new Date().toISOString() });
    return true;
  });
}
