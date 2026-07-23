import type { RegistroSaude } from "../domain/types";
import { loadDB, mutate, uid } from "./db";

export function listRegistros(animalId: string): RegistroSaude[] {
  return loadDB()
    .registrosSaude.filter((r) => r.animalId === animalId)
    .sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));
}

export function createRegistro(r: Omit<RegistroSaude, "id">): RegistroSaude {
  return mutate((db) => {
    const rec: RegistroSaude = { ...r, id: uid("rs") };
    db.registrosSaude.push(rec);
    return rec;
  });
}

export function deleteRegistro(id: string): void {
  mutate((db) => {
    db.registrosSaude = db.registrosSaude.filter((r) => r.id !== id);
  });
}

export function alertasProximos(
  animaisIds: string[],
  dias = 30
): { registro: RegistroSaude; animalId: string; diasRestantes: number }[] {
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  return loadDB()
    .registrosSaude.filter((r) => animaisIds.includes(r.animalId) && !!r.dataProxima)
    .map((r) => ({
      registro: r,
      animalId: r.animalId,
      diasRestantes: Math.ceil(
        (new Date(r.dataProxima!).getTime() - hoje.getTime()) / 86400000
      ),
    }))
    .filter((x) => x.diasRestantes >= 0 && x.diasRestantes <= dias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}
