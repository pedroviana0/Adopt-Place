import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchPublicOrganizations } from "@/lib/queries/public-profiles";
import { prisma } from "@/lib/prisma";

const findMany = vi.mocked(prisma.organizacao.findMany);

beforeEach(() => vi.clearAllMocks());

describe("public organization search query", () => {
  it.each(["Proteção à Vida", "PROTECAO A VIDA", "  protecao   a vida  "])(
    "normaliza %s com a função compartilhada",
    async (term) => {
      findMany.mockResolvedValue([]);
      await searchPublicOrganizations(term);
      expect(findMany).toHaveBeenCalledWith({
        where: {
          usuario: { ativo: true },
          razaoSocialNormalizada: { contains: "protecao a vida" },
        },
        orderBy: { razaoSocial: "asc" },
        take: 10,
        select: { id: true, razaoSocial: true, cidade: true, estado: true },
      });
    },
  );

  it("limita no banco e devolve somente a projeção pública", async () => {
    findMany.mockResolvedValue([
      { id: "org-1", razaoSocial: "Proteção Animal", cidade: "Volta Redonda", estado: "RJ" },
    ] as never);
    await expect(searchPublicOrganizations("protecao")).resolves.toEqual([
      { id: "org-1", nome: "Proteção Animal", municipio: "Volta Redonda", uf: "RJ" },
    ]);
  });
});
