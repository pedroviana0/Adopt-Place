import { StatusAnimal } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicFosterProfile } from "@/lib/queries/public-profiles";
import { prisma } from "@/lib/prisma";

const fosterId = "cm00000000000000000000030";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.acolhedorIndependente.findFirst).mockResolvedValue({
    id: fosterId,
    nomeCompleto: "Marina da Silva",
    descricao: null,
    fotoUrl: null,
    cidade: "Barra Mansa",
    estado: "RJ",
  } as never);
  vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.animal.count).mockResolvedValue(1 as never);
  vi.mocked(prisma.especie.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.raca.findMany).mockResolvedValue([] as never);
});

describe("perfil público do acolhedor", () => {
  it("deriva primeiro nome e inicial do último sobrenome no servidor", async () => {
    const result = await getPublicFosterProfile(fosterId, { page: 1 });

    expect(result?.profile.nome).toBe("Marina S.");
    expect(result?.profile).not.toHaveProperty("nomeCompleto");
  });

  it("consulta apenas conta ativa e devolve null sem executar o catálogo", async () => {
    vi.mocked(prisma.acolhedorIndependente.findFirst).mockResolvedValue(null as never);

    const result = await getPublicFosterProfile(fosterId, { page: 1 });

    expect(result).toBeNull();
    expect(prisma.acolhedorIndependente.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: fosterId, usuario: { ativo: true } } }),
    );
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
  });

  it("isola catálogo pelo acolhedor e por disponibilidade", async () => {
    await getPublicFosterProfile(fosterId, {
      especieId: "species-1",
      porte: "P",
      sexo: "F",
      page: 2,
    });

    const where = {
      acolhedorId: fosterId,
      status: StatusAnimal.DISPONIVEL,
      especieId: "species-1",
      racaId: undefined,
      porte: "P",
      sexo: "F",
    };
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, skip: 30, take: 30 }),
    );
    expect(prisma.animal.count).toHaveBeenCalledWith({ where });
    expect(prisma.especie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          animais: { some: { acolhedorId: fosterId, status: StatusAnimal.DISPONIVEL } },
        },
      }),
    );
  });
});
