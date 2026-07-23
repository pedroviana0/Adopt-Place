import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  completeCuidadoPlanejado,
} from "@/lib/actions/cuidados-planejados";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const organizationId = "cm00000000000000000000501";
const careId = "cm00000000000000000000502";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000503",
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

type Care = {
  id: string;
  animalId: string;
  tipo: "VACINA" | "CONSULTA";
  status: "PENDENTE";
  animal: { organizacaoId: string | null; acolhedorId: string | null };
};

const findCare = prisma.cuidadoPlanejado.findUnique as unknown as {
  mockResolvedValue(value: Care | null): void;
};
const transactionMock = prisma.$transaction as unknown as {
  mockImplementation(
    implementation: (callback: (tx: CompletionTransaction) => Promise<unknown>) => Promise<unknown>,
  ): void;
};

type CompletionTransaction = {
  cuidadoPlanejado: {
    updateMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  registroSaude: { create: ReturnType<typeof vi.fn> };
};

function transactionClient(): CompletionTransaction {
  return {
    cuidadoPlanejado: {
      updateMany: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: careId }),
    },
    registroSaude: {
      create: vi.fn().mockResolvedValue({ id: "record-created" }),
    },
  };
}

function mockTransaction(tx: CompletionTransaction): void {
  transactionMock.mockImplementation(async (callback) => callback(tx));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("completeCuidadoPlanejado", () => {
  it("claims pending care atomically and prevents a second health record", async () => {
    const tx = transactionClient();
    tx.cuidadoPlanejado.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    findCare.mockResolvedValue({
      id: careId,
      animalId: "animal-1",
      tipo: "VACINA",
      status: "PENDENTE",
      animal: { organizacaoId: organizationId, acolhedorId: null },
    });
    mockTransaction(tx);
    const input = {
      tipoRegistro: "VACINA" as const,
      nomeCustom: "V10",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
    };

    await expect(completeCuidadoPlanejado(careId, input)).resolves.toEqual({
      success: true,
    });
    await expect(completeCuidadoPlanejado(careId, input)).resolves.toEqual({
      error: "Cuidado ja concluido ou cancelado",
    });
    expect(tx.registroSaude.create).toHaveBeenCalledTimes(1);
  });

  it("completes CONSULTA without creating health history", async () => {
    const tx = transactionClient();
    tx.cuidadoPlanejado.updateMany.mockResolvedValue({ count: 1 });
    findCare.mockResolvedValue({
      id: careId,
      animalId: "animal-1",
      tipo: "CONSULTA",
      status: "PENDENTE",
      animal: { organizacaoId: organizationId, acolhedorId: null },
    });
    mockTransaction(tx);

    await expect(completeCuidadoPlanejado(careId)).resolves.toEqual({
      success: true,
    });
    expect(tx.registroSaude.create).not.toHaveBeenCalled();
  });
});
