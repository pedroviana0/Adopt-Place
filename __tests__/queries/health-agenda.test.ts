import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHealthAgenda } from "@/lib/queries/health-dashboard";

const organizationId = "cm00000000000000000000201";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000202",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: organizationId,
      acolhedorId: null,
    },
  };
}

const findPlannedCare = prisma.cuidadoPlanejado.findMany as unknown as {
  mockResolvedValue(value: Array<{
    id: string;
    animalId: string;
    tipo: "VACINA";
    status: "PENDENTE";
    dataHoraPlanejada: Date;
    titulo: string;
    observacoes: string | null;
    localProfissional: string | null;
    origemRegistroSaudeId: string;
    animal: { id: string; nome: string };
  }>): void;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("getHealthAgenda", () => {
  it("applies owner, animal, type, overdue, and period filters chronologically", async () => {
    findPlannedCare.mockResolvedValue([
      {
        id: "care-1",
        animalId: "cm00000000000000000000203",
        tipo: "VACINA",
        status: "PENDENTE",
        dataHoraPlanejada: new Date("2026-07-20T12:00:00.000Z"),
        titulo: "V10",
        observacoes: null,
        localProfissional: null,
        origemRegistroSaudeId: "record-1",
        animal: { id: "cm00000000000000000000203", nome: "Luna" },
      },
    ]);

    const result = await getHealthAgenda(
      {
        animalId: "cm00000000000000000000203",
        tipo: "VACINA",
        situacao: "ATRASADO",
        from: "2026-07-01",
        to: "2026-07-31",
      },
      new Date("2026-07-22T15:00:00.000Z"),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "care-1", situacao: "ATRASADO" });
    const query = vi.mocked(prisma.cuidadoPlanejado.findMany).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).toContain(organizationId);
    expect(JSON.stringify(query)).toContain("cm00000000000000000000203");
    expect(JSON.stringify(query)).toContain("VACINA");
    expect(query?.orderBy).toEqual({ dataHoraPlanejada: "asc" });
  });

  it("reads the unique planned-care source without deriving a second alert", async () => {
    findPlannedCare.mockResolvedValue([]);

    await getHealthAgenda({}, new Date("2026-07-22T15:00:00.000Z"));

    expect(prisma.cuidadoPlanejado.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.registroSaude.findMany).not.toHaveBeenCalled();
  });
});
