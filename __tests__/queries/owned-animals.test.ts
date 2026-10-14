import { SituacaoLT, StatusAnimal } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inTreatmentWhere } from "@/lib/lar-temporario";
import { prisma } from "@/lib/prisma";
import {
  getOwnedAnimals,
  ownedAnimalSummarySelect,
  toOwnedAnimalDTO,
} from "@/lib/queries/owned-animals";

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

  it("filtra animais em tratamento pela mesma regra do indicador (spec 009)", async () => {
    await getOwnedAnimals("org-1", "ORGANIZACAO", { tratamento: "1" });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      organizacaoId: "org-1",
      AND: [inTreatmentWhere],
    });
  });

  it("traduz EM_LT_SEM_VINCULO em EM_LT sem lar temporario", async () => {
    await getOwnedAnimals("org-1", "ORGANIZACAO", { lt: "EM_LT_SEM_VINCULO" });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      organizacaoId: "org-1",
      situacaoLT: SituacaoLT.EM_LT,
      larTemporarioId: null,
    });
  });

  it("filtra por situacao de LT", async () => {
    await getOwnedAnimals("org-1", "ORGANIZACAO", { lt: "PROCURANDO" });

    expect(vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0]?.where).toEqual({
      organizacaoId: "org-1",
      situacaoLT: SituacaoLT.PROCURANDO,
    });
  });
});

describe("DTO de animal gerenciado (spec 009)", () => {
  function record(overrides: Record<string, unknown> = {}) {
    return {
      id: "a1",
      nome: "Seninha",
      status: StatusAnimal.DISPONIVEL,
      porte: "P",
      sexo: "F",
      cor: "Tricolor",
      idadeEstimada: null,
      castrado: true,
      situacaoLT: SituacaoLT.EM_LT,
      larTemporario: { id: "lt1", nomeTutor: "Maria Souza" },
      especie: { id: "e1", nome: "Gato" },
      raca: null,
      fotos: [],
      _count: { solicitacoes: 0, cuidadosPlanejados: 1 },
      ...overrides,
    } as never;
  }

  it("seleciona LT e conta so cuidados de tratamento pendentes", () => {
    expect(ownedAnimalSummarySelect).toMatchObject({
      situacaoLT: true,
      larTemporario: { select: { id: true, nomeTutor: true } },
      _count: {
        select: {
          cuidadosPlanejados: {
            where: { tipo: "MEDICAMENTO_TRATAMENTO", status: "PENDENTE" },
          },
        },
      },
    });
  });

  it("expoe situacaoLT, larTemporario e emTratamento", () => {
    expect(toOwnedAnimalDTO(record())).toMatchObject({
      situacaoLT: SituacaoLT.EM_LT,
      larTemporario: { id: "lt1", nomeTutor: "Maria Souza" },
      emTratamento: true,
    });
  });

  it("nao marca em tratamento um animal ADOTADO com cuidado pendente", () => {
    expect(
      toOwnedAnimalDTO(record({ status: StatusAnimal.ADOTADO })).emTratamento,
    ).toBe(false);
  });

  it("nao marca em tratamento sem cuidado pendente", () => {
    expect(
      toOwnedAnimalDTO(record({ _count: { solicitacoes: 0, cuidadosPlanejados: 0 } }))
        .emTratamento,
    ).toBe(false);
  });
});
