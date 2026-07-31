import { Prisma, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createRegistroSaude,
  deleteRegistroSaude,
  updateRegistroSaude,
} from "@/lib/actions/registro-saude";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const organizationId = "cm00000000000000000000401";
const animalId = "cm00000000000000000000402";
const recordId = "cm00000000000000000000403";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000404",
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

const findAnimal = prisma.animal.findFirst as unknown as {
  mockResolvedValue(value: { id?: string; organizacaoId?: string | null; acolhedorId?: string | null } | null): void;
};
const findRecord = prisma.registroSaude.findFirst as unknown as {
  mockResolvedValue(value: { animalId?: string; id?: string } | null): void;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizationId },
    acolhedor: null,
  } as never);
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    callback(prisma as unknown as Prisma.TransactionClient),
  );
  vi.mocked(prisma.registroSaude.create).mockResolvedValue({ id: recordId } as never);
});

describe("health record actions", () => {
  it("revalidates an inactive account before any health lookup", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: false,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizationId },
      acolhedor: null,
    } as never);

    const result = await createRegistroSaude(animalId, {
      tipoRegistro: "PROCEDIMENTO",
      procedimento: "Castracao",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
    });

    expect(result.code).toBe("INACTIVE_ACCOUNT");
    expect(prisma.animal.findFirst).not.toHaveBeenCalled();
  });

  it("creates MEDICAMENTO_TRATAMENTO with internal fields for an owned animal", async () => {
    findAnimal.mockResolvedValue({ organizacaoId: organizationId, acolhedorId: null });

    const result = await createRegistroSaude(animalId, {
      tipoRegistro: "MEDICAMENTO_TRATAMENTO",
      medicamentoTratamento: "Antibiotico",
      titulo: "Tratamento pos-operatorio",
      observacoes: "Uso interno",
      profissionalClinica: "Clinica Central",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
    });

    expect(result).toEqual({ success: true, id: recordId });
    expect(prisma.registroSaude.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        animalId,
        tipo: "MEDICAMENTO_TRATAMENTO",
        medicamentoTratamento: "Antibiotico",
        titulo: "Tratamento pos-operatorio",
        observacoes: "Uso interno",
        profissionalClinica: "Clinica Central",
      }),
      select: { id: true },
    });
  });

  it("upserts one future care and removes it when next date is cleared", async () => {
    findAnimal.mockResolvedValue({ organizacaoId: organizationId, acolhedorId: null });
    findRecord.mockResolvedValue({ animalId });
    const nextDate = new Date("2026-08-20T12:00:00.000Z");

    await createRegistroSaude(animalId, {
      tipoRegistro: "VACINA",
      nomeCustom: "V10",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
      dataProximaDose: nextDate,
    });

    expect(prisma.cuidadoPlanejado.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.cuidadoPlanejado.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { origemRegistroSaudeId: recordId },
        create: expect.objectContaining({
          origemRegistroSaudeId: recordId,
          dataHoraPlanejada: nextDate,
        }),
      }),
    );

    await updateRegistroSaude(recordId, {
      tipoRegistro: "VACINA",
      nomeCustom: "V10",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
    });

    expect(prisma.cuidadoPlanejado.deleteMany).toHaveBeenCalledWith({
      where: {
        origemRegistroSaudeId: recordId,
        status: "PENDENTE",
      },
    });
  });

  it("updates PROCEDIMENTO only when the current responsible owns the animal", async () => {
    findRecord.mockResolvedValue({ animalId });

    const result = await updateRegistroSaude(recordId, {
      tipoRegistro: "PROCEDIMENTO",
      procedimento: "Castracao",
      titulo: "Cirurgia",
      dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
    });

    expect(result).toEqual({ success: true });
    expect(prisma.registroSaude.update).toHaveBeenCalledWith({
      where: { id: recordId },
      data: expect.objectContaining({
        tipo: "PROCEDIMENTO",
        procedimento: "Castracao",
      }),
    });
  });

  it("denies create and delete for another responsible party", async () => {
    findAnimal.mockResolvedValue(null);
    findRecord.mockResolvedValue(null);

    await expect(
      createRegistroSaude(animalId, {
        tipoRegistro: "PROCEDIMENTO",
        procedimento: "Curativo",
        dataAplicacao: new Date("2026-07-20T12:00:00.000Z"),
      }),
    ).resolves.toEqual({ error: "Animal nao encontrado" });
    await expect(deleteRegistroSaude(recordId)).resolves.toEqual({
      error: "Registro de saude nao encontrado",
    });
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
    expect(prisma.registroSaude.delete).not.toHaveBeenCalled();
  });
});
