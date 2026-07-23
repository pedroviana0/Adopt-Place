import { assertNaoRelacionaSiMesmo, assertXorResponsavel } from "../domain/rules";
import type { Animal, FotoAnimal } from "../domain/types";
import { loadDB, mutate, uid } from "./db";

export interface AnimalFilters {
  especieId?: string;
  racaId?: string;
  porte?: string;
  sexo?: string;
  cidade?: string;
  tags?: string[]; // Castrado, Vacinado, Vermifugado, Testado
  status?: string;
  ownerId?: { organizacaoId?: string; acolhedorId?: string };
}

function cidadeDoResponsavel(a: Animal): string | null {
  const db = loadDB();
  if (a.organizacaoId) return db.organizacoes.find((o) => o.id === a.organizacaoId)?.cidade ?? null;
  if (a.acolhedorId) return db.acolhedores.find((o) => o.id === a.acolhedorId)?.cidade ?? null;
  return null;
}

export function listAnimais(filters: AnimalFilters = {}): Animal[] {
  const db = loadDB();
  return db.animais.filter((a) => {
    if (filters.status && a.status !== filters.status) return false;
    if (filters.especieId && a.especieId !== filters.especieId) return false;
    if (filters.racaId && a.racaId !== filters.racaId) return false;
    if (filters.porte && a.porte !== filters.porte) return false;
    if (filters.sexo && a.sexo !== filters.sexo) return false;
    if (filters.cidade) {
      const c = cidadeDoResponsavel(a);
      if (!c || c.toLowerCase() !== filters.cidade.toLowerCase()) return false;
    }
    if (filters.ownerId?.organizacaoId && a.organizacaoId !== filters.ownerId.organizacaoId) return false;
    if (filters.ownerId?.acolhedorId && a.acolhedorId !== filters.ownerId.acolhedorId) return false;
    if (filters.tags && filters.tags.length > 0) {
      const rs = db.registrosSaude.filter((r) => r.animalId === a.id);
      for (const t of filters.tags) {
        if (t === "Castrado" && !a.castrado) return false;
        if (t === "Vacinado" && !rs.some((r) => r.tipo === "VACINA")) return false;
        if (t === "Vermifugado" && !rs.some((r) => r.tipo === "CONTROLE_PARASITAS")) return false;
        if (t === "Testado" && !rs.some((r) => r.tipo === "TESTE_DOENCA")) return false;
      }
    }
    return true;
  });
}

export function getAnimal(id: string): Animal | undefined {
  return loadDB().animais.find((a) => a.id === id);
}

export function listFotos(animalId: string): FotoAnimal[] {
  return loadDB()
    .fotos.filter((f) => f.animalId === animalId)
    .sort((a, b) => Number(b.principal) - Number(a.principal) || a.ordem - b.ordem);
}

export function fotoPrincipal(animalId: string): FotoAnimal | undefined {
  return listFotos(animalId).find((f) => f.principal) ?? listFotos(animalId)[0];
}

export function createAnimal(
  data: Omit<Animal, "id" | "criadoEm">,
  fotos: { url: string; principal: boolean }[]
): Animal {
  assertXorResponsavel(data);
  if (fotos.length === 0 || !fotos.some((f) => f.principal))
    throw new Error("O animal precisa de pelo menos uma foto principal");
  return mutate((db) => {
    const a: Animal = { ...data, id: uid("a"), criadoEm: new Date().toISOString() };
    db.animais.push(a);
    fotos.forEach((f, i) => {
      db.fotos.push({
        id: uid("f"),
        animalId: a.id,
        urlFoto: f.url,
        principal: f.principal,
        ordem: i,
        criadoEm: new Date().toISOString(),
      });
    });
    return a;
  });
}

export function updateAnimal(id: string, patch: Partial<Animal>): Animal {
  return mutate((db) => {
    const idx = db.animais.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Animal não encontrado");
    const merged = { ...db.animais[idx], ...patch };
    assertXorResponsavel(merged);
    db.animais[idx] = merged;
    return merged;
  });
}

export function replaceFotos(animalId: string, fotos: { url: string; principal: boolean }[]): void {
  if (fotos.length === 0)
    throw new Error("O animal precisa de pelo menos uma foto principal");
  if (!fotos.some((f) => f.principal))
    throw new Error("O animal precisa de pelo menos uma foto principal");
  mutate((db) => {
    db.fotos = db.fotos.filter((f) => f.animalId !== animalId);
    fotos.forEach((f, i) => {
      db.fotos.push({
        id: uid("f"),
        animalId,
        urlFoto: f.url,
        principal: f.principal,
        ordem: i,
        criadoEm: new Date().toISOString(),
      });
    });
  });
}

// Remove uma foto garantindo que o animal continue com uma foto principal.
// - Se for a única foto, bloqueia com mensagem exata da spec.
// - Se for a principal e existirem outras, exige `novaPrincipalId`.
export function removerFoto(animalId: string, fotoId: string, novaPrincipalId?: string): void {
  mutate((db) => {
    const fotos = db.fotos.filter((f) => f.animalId === animalId);
    if (fotos.length <= 1)
      throw new Error("O animal precisa de pelo menos uma foto principal");
    const alvo = fotos.find((f) => f.id === fotoId);
    if (!alvo) throw new Error("Foto não encontrada");
    if (alvo.principal) {
      const nova = novaPrincipalId
        ? fotos.find((f) => f.id === novaPrincipalId && f.id !== fotoId)
        : undefined;
      if (!nova)
        throw new Error("Selecione uma nova foto principal antes de excluir esta");
      db.fotos.forEach((f) => {
        if (f.animalId === animalId) f.principal = f.id === nova.id;
      });
    }
    db.fotos = db.fotos.filter((f) => f.id !== fotoId);
  });
}

export function listRelacionados(animalId: string): Animal[] {
  const db = loadDB();
  const ids = db.relacionados.filter((r) => r.animalId === animalId).map((r) => r.animalRelacionadoId);
  return db.animais.filter((a) => ids.includes(a.id));
}

export function addRelacionamento(a: string, b: string): void {
  assertNaoRelacionaSiMesmo(a, b);
  mutate((db) => {
    const exists = db.relacionados.some(
      (r) => (r.animalId === a && r.animalRelacionadoId === b) ||
             (r.animalId === b && r.animalRelacionadoId === a)
    );
    if (exists) return;
    db.relacionados.push({ animalId: a, animalRelacionadoId: b });
    db.relacionados.push({ animalId: b, animalRelacionadoId: a });
  });
}

export function removeRelacionamento(a: string, b: string): void {
  mutate((db) => {
    db.relacionados = db.relacionados.filter(
      (r) => !((r.animalId === a && r.animalRelacionadoId === b) ||
               (r.animalId === b && r.animalRelacionadoId === a))
    );
  });
}
