import { StatusAnimal } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicOrganizationProfile } from "@/lib/queries/public-profiles";
import { prisma } from "@/lib/prisma";

const organizationId = "cm00000000000000000000010";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.organizacao.findFirst).mockResolvedValue({
    id: organizationId,
    razaoSocial: "Proteção Animal",
    descricao: null,
    fotoUrl: null,
    endereco: "Rua Exemplo, 10",
    cidade: "Volta Redonda",
    estado: "RJ",
  } as never);
  vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.animal.count).mockResolvedValue(61 as never);
  vi.mocked(prisma.especie.findMany).mockResolvedValue([
    { id: "species-1", nome: "Cachorro" },
  ] as never);
  vi.mocked(prisma.raca.findMany).mockResolvedValue([
    { id: "breed-1", nome: "SRD", especieId: "species-1" },
  ] as never);
});

describe("catálogo público por organização", () => {
  it("isola responsável/status, aplica filtros e pagina no banco em lotes de 30", async () => {
    const result = await getPublicOrganizationProfile(organizationId, {
      especieId: "species-1",
      racaId: "breed-1",
      porte: "M",
      sexo: "F",
      page: 3,
    });

    const expectedWhere = {
      organizacaoId: organizationId,
      status: StatusAnimal.DISPONIVEL,
      especieId: "species-1",
      racaId: "breed-1",
      porte: "M",
      sexo: "F",
    };
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedWhere,
        orderBy: [{ criadoEm: "desc" }, { nome: "asc" }],
        skip: 60,
        take: 30,
      }),
    );
    expect(prisma.animal.count).toHaveBeenCalledWith({ where: expectedWhere });
    expect(result?.catalog.pagination).toEqual({
      page: 3,
      perPage: 30,
      total: 61,
      totalPages: 3,
    });
  });

  it("oferece somente espécies e raças usadas por animais disponíveis da organização", async () => {
    const result = await getPublicOrganizationProfile(organizationId, { page: 1 });
    const ownerScope = {
      organizacaoId: organizationId,
      status: StatusAnimal.DISPONIVEL,
    };

    expect(prisma.especie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { animais: { some: ownerScope } } }),
    );
    expect(prisma.raca.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { animais: { some: ownerScope } } }),
    );
    expect(result?.catalog.filterOptions.racas).toEqual([
      { id: "breed-1", nome: "SRD", especieId: "species-1" },
    ]);
  });

  it("não oferece filtro de raça quando o catálogo não possui raça registrada", async () => {
    vi.mocked(prisma.raca.findMany).mockResolvedValue([] as never);

    const result = await getPublicOrganizationProfile(organizationId, { page: 1 });

    expect(result?.catalog.filterOptions.racas).toEqual([]);
  });
});
