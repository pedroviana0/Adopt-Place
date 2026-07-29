import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.animal.findMany).mockResolvedValue([]);
});

describe("getOwnedAnimals filters", () => {
  it("combines canonical status with organization ownership", async () => {
    await getOwnedAnimals("org-1", "ORGANIZACAO", { status: "DISPONIVEL" });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      organizacaoId: "org-1",
      status: "DISPONIVEL",
    });
  });

  it("keeps foster ownership while combining all supported filters", async () => {
    await getOwnedAnimals("foster-1", "ACOLHEDOR", {
      q: "luna",
      status: "EM_CUIDADOS",
      especieId: "species-1",
      racaId: "breed-1",
      porte: "M",
      sexo: "F",
    });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      acolhedorId: "foster-1",
      nome: { contains: "luna", mode: "insensitive" },
      status: "EM_CUIDADOS",
      especieId: "species-1",
      racaId: "breed-1",
      porte: "M",
      sexo: "F",
    });
  });
});
