// --- Public showcase catalog (Issue #27 / T040): real HTTP consumption ---
// Consumes GET /api/catalogos over the same-origin/proxy boundary.
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

export async function fetchCatalogosGerenciamento(): Promise<PublicCatalog> {
  const res = await fetch("/api/catalogos?context=management", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao carregar as espécies e raças");
  return (await res.json()) as PublicCatalog;
}
