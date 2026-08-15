import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getAnimais } from "@/app/api/animais/route";
import { GET as getAnimalDetail } from "@/app/api/animais/[id]/route";
import { GET as getMetrics } from "@/app/api/metrics/route";
import { GET as getCatalogos } from "@/app/api/catalogos/route";
import { prisma } from "@/lib/prisma";

const showcaseAnimal = {
  id: "a1",
  nome: "Luna",
  porte: "M",
  sexo: "F",
  idadeEstimada: "2 anos",
  castrado: true,
  status: "DISPONIVEL",
  fotos: [{ urlFoto: "/luna.jpg" }],
  especie: { nome: "Cachorro" },
  raca: { nome: "SRD" },
  registrosSaude: [{ tipo: "VACINA" }],
  organizacao: { id: "org-profile-1", razaoSocial: "Cia Animal VR", cidade: "Volta Redonda" },
  acolhedor: null,
};

const detailAnimal = {
  id: "a1",
  nome: "Luna",
  porte: "M",
  sexo: "F",
  cor: "Caramelo",
  idadeEstimada: "2 anos",
  castrado: true,
  descricao: "Docil",
  status: "DISPONIVEL",
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  especie: { nome: "Cachorro" },
  raca: { nome: "SRD" },
  fotos: [{ id: "f1", urlFoto: "/luna.jpg", principal: true }],
  registrosSaude: [
    { id: "s1", tipo: "VACINA", dataRegistro: new Date("2026-01-02T00:00:00.000Z") },
  ],
  organizacao: { id: "org-profile-1", razaoSocial: "Cia Animal VR", cidade: "Volta Redonda" },
  acolhedor: null,
  relacionadosA: [],
};

function collectKeys(value: unknown): Set<string> {
  const keys = new Set<string>();
  const visit = (current: unknown): void => {
    if (!current || typeof current !== "object") return;
    if (Array.isArray(current)) return current.forEach(visit);
    for (const [key, nested] of Object.entries(current)) {
      keys.add(key);
      visit(nested);
    }
  };
  visit(value);
  return keys;
}

const forbiddenPublicKeys = [
  "cnpj",
  "cpf",
  "email",
  "telefone",
  "endereco",
  "senhaHash",
  "usuarioId",
  "organizacaoId",
  "acolhedorId",
  "nomeDoenca",
  "resultado",
  "medicamentoTratamento",
  "procedimento",
  "nomeVacina",
];

describe("public showcase API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/animais returns allowlisted summaries with tags", async () => {
    vi.mocked(prisma.animal.findMany).mockResolvedValue([showcaseAnimal] as never);
    vi.mocked(prisma.animal.count).mockResolvedValue(1 as never);

    const res = await getAnimais(new Request("http://localhost/api/animais?porte=M"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.animals).toHaveLength(1);
    expect(body.animals[0]).toMatchObject({
      id: "a1",
      responsavel: "Cia Animal VR",
      responsavelId: "org-profile-1",
      responsavelTipo: "ORGANIZACAO",
      cidade: "Volta Redonda",
      fotoPrincipal: "/luna.jpg",
    });
    expect(Array.isArray(body.animals[0].tags)).toBe(true);
    expect(body.pagination).toMatchObject({ page: 1, total: 1 });
    for (const key of forbiddenPublicKeys) {
      expect(collectKeys(body).has(key), `${key} leaked`).toBe(false);
    }
  });

  it("GET /api/animais/[id] returns 200 with a safe health summary only", async () => {
    vi.mocked(prisma.animal.findUnique).mockResolvedValue(detailAnimal as never);

    const res = await getAnimalDetail(new Request("http://localhost/api/animais/a1"), {
      params: Promise.resolve({ id: "a1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      responsavel: "Cia Animal VR",
      responsavelId: "org-profile-1",
      responsavelTipo: "ORGANIZACAO",
    });
    expect(body.resumoSaude).toEqual([
      { id: "s1", tipo: "VACINA", dataRegistro: "2026-01-02T00:00:00.000Z" },
    ]);
    for (const key of forbiddenPublicKeys) {
      expect(collectKeys(body).has(key), `${key} leaked`).toBe(false);
    }
  });

  it("GET /api/animais/[id] returns 404 when the animal does not exist", async () => {
    vi.mocked(prisma.animal.findUnique).mockResolvedValue(null as never);

    const res = await getAnimalDetail(new Request("http://localhost/api/animais/none"), {
      params: Promise.resolve({ id: "none" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api/metrics returns aggregate counts only", async () => {
    vi.mocked(prisma.animal.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.solicitacaoAdocao.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.organizacao.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.acolhedorIndependente.count).mockResolvedValue(1 as never);

    const res = await getMetrics();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      availableAnimals: 5,
      completedAdoptions: 3,
      responsibleParties: 3,
    });
  });

  it("GET /api/catalogos returns species/breeds and available cities", async () => {
    vi.mocked(prisma.especie.findMany)
      .mockResolvedValueOnce([
        { id: "e1", nome: "Cachorro" },
        { id: "e2", nome: "Gato" },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "e2",
          nome: "Gato",
          racas: [{ id: "r2", nome: "Sem raça definida (SRD)", especieId: "e2" }],
        },
        {
          id: "e1",
          nome: "Cachorro",
          racas: [
            { id: "legacy", nome: "SRD", especieId: "e1" },
            { id: "r1", nome: "Sem raça definida (SRD)", especieId: "e1" },
          ],
        },
      ] as never);
    vi.mocked(prisma.organizacao.findMany).mockResolvedValue([{ cidade: "Volta Redonda" }] as never);
    vi.mocked(prisma.acolhedorIndependente.findMany).mockResolvedValue([{ cidade: "Barra Mansa" }] as never);

    const res = await getCatalogos(new Request("http://localhost/api/catalogos"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.especies.map((especie: { nome: string }) => especie.nome)).toEqual([
      "Cachorro",
      "Gato",
    ]);
    expect(body.especies[0].racas.map((raca: { nome: string }) => raca.nome)).toEqual([
      "Sem raça definida (SRD)",
    ]);
    expect(prisma.especie.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          racas: expect.objectContaining({
            where: { animais: { some: { status: "DISPONIVEL" } } },
            orderBy: { nome: "asc" },
          }),
        }),
      }),
    );
    expect(body.cidades).toContain("Volta Redonda");
    expect(body.cidades).toContain("Barra Mansa");
  });

  it("GET /api/catalogos?context=management mantém raças ainda sem animal disponível", async () => {
    vi.mocked(prisma.especie.findMany)
      .mockResolvedValueOnce([
        { id: "e1", nome: "Cachorro" },
        { id: "e2", nome: "Gato" },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "e1",
          nome: "Cachorro",
          racas: [
            { id: "r1", nome: "Sem raça definida (SRD)", especieId: "e1" },
            { id: "r2", nome: "Akita", especieId: "e1" },
          ],
        },
        { id: "e2", nome: "Gato", racas: [] },
      ] as never);

    const res = await getCatalogos(
      new Request("http://localhost/api/catalogos?context=management"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.especies[0].racas.map((raca: { nome: string }) => raca.nome)).toEqual([
      "Akita",
      "Sem raça definida (SRD)",
    ]);
    expect(body.cidades).toEqual([]);
    expect(prisma.especie.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          racas: expect.not.objectContaining({ where: expect.anything() }),
        }),
      }),
    );
  });
});
