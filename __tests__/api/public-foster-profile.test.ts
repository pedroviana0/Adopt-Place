import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getFosterProfile } from "@/app/api/perfis/acolhedor/[id]/route";
import { prisma } from "@/lib/prisma";

const fosterId = "cm00000000000000000000030";

function collectKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  const visit = (current: unknown): void => {
    if (!current || typeof current !== "object") return;
    if (Array.isArray(current)) return current.forEach(visit);
    for (const [key, nested] of Object.entries(current)) {
      keys.add(key.toLowerCase());
      visit(nested);
    }
  };
  visit(value);
  return keys;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.acolhedorIndependente.findFirst).mockResolvedValue({
    id: fosterId,
    nomeCompleto: "Marina da Silva",
    descricao: "Acolhimento responsável.",
    fotoUrl: null,
    cidade: "Barra Mansa",
    estado: "RJ",
  } as never);
  vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.animal.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.especie.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.raca.findMany).mockResolvedValue([] as never);
});

describe("GET /api/perfis/acolhedor/[id]", () => {
  it("expõe identificação mínima sem identidade, endereço ou contato privados", async () => {
    const response = await getFosterProfile(
      new Request(`http://localhost/api/perfis/acolhedor/${fosterId}`),
      { params: Promise.resolve({ id: fosterId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile).toEqual({
      id: fosterId,
      tipo: "ACOLHEDOR",
      nome: "Marina S.",
      descricao: "Acolhimento responsável.",
      fotoUrl: null,
      municipio: "Barra Mansa",
      uf: "RJ",
    });
    expect(JSON.stringify(body)).not.toContain("Marina da Silva");

    const keys = collectKeys(body);
    for (const forbidden of [
      "nomecompleto", "endereco", "cep", "cpf", "cnpj", "email", "telefone",
      "latitude", "longitude", "precisaocoordenada", "usuarioid",
    ]) {
      expect(keys.has(forbidden), `${forbidden} leaked`).toBe(false);
    }
  });

  it("usa 404 indistinguível e não consulta animais para perfil indisponível", async () => {
    vi.mocked(prisma.acolhedorIndependente.findFirst).mockResolvedValue(null as never);

    const response = await getFosterProfile(
      new Request(`http://localhost/api/perfis/acolhedor/${fosterId}`),
      { params: Promise.resolve({ id: fosterId }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "PROFILE_NOT_FOUND", message: "Perfil não encontrado." },
    });
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
  });
});
