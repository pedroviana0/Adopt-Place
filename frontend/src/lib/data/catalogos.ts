import { loadDB } from "./db";

export const listEspecies = () => loadDB().especies;
export const listRacas = (especieId?: string) =>
  loadDB().racas.filter((r) => !especieId || r.especieId === especieId);
export const listVacinas = () => loadDB().vacinas;
export const listDoencas = () => loadDB().doencas;

// --- Public showcase catalog (Issue #27 / T040): real HTTP consumption ---
// Consumes GET /api/catalogos over the same-origin/proxy boundary. Used only by
// the public showcase filters; the mock helpers above remain for other flows.
export interface PublicCatalog {
  especies: {
    id: string;
    nome: string;
    racas: { id: string; nome: string; especieId: string }[];
  }[];
  cidades: string[];
}

export async function fetchCatalogos(): Promise<PublicCatalog> {
  const res = await fetch("/api/catalogos", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Falha ao carregar os catálogos");
  return (await res.json()) as PublicCatalog;
}
