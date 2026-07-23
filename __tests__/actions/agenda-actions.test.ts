import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelCuidadoPlanejado,
  createConsultaPlanejada,
  rescheduleCuidadoPlanejado,
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("planned care agenda mutations", () => {
  it("creates a CONSULTA only for an owned animal", async () => {
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId: organizationId,
      acolhedorId: null,
    } as never);
    const futureDate = new Date(Date.now() + 86_400_000);

    await expect(
      createConsultaPlanejada({
        animalId: "cm00000000000000000000504",
        dataHoraPlanejada: futureDate,
        titulo: "Retorno",
      }),
    ).resolves.toEqual({ success: true });

    expect(prisma.cuidadoPlanejado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipo: "CONSULTA",
        status: "PENDENTE",
        dataHoraPlanejada: futureDate,
      }),
    });
  });

  it("reschedules and cancels the same pending row", async () => {
    vi.mocked(prisma.cuidadoPlanejado.findUnique).mockResolvedValue({
      id: careId,
      status: "PENDENTE",
      animal: { organizacaoId: organizationId, acolhedorId: null },
    } as never);
    vi.mocked(prisma.cuidadoPlanejado.updateMany).mockResolvedValue({ count: 1 });
    const futureDate = new Date(Date.now() + 172_800_000);

    await expect(
      rescheduleCuidadoPlanejado(careId, { dataHoraPlanejada: futureDate }),
    ).resolves.toEqual({ success: true });
    await expect(
      cancelCuidadoPlanejado(careId, { confirmado: true }),
    ).resolves.toEqual({ success: true });

    expect(prisma.cuidadoPlanejado.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: careId, status: "PENDENTE" },
      data: { dataHoraPlanejada: futureDate },
    });
    expect(prisma.cuidadoPlanejado.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: careId, status: "PENDENTE" },
      data: expect.objectContaining({ status: "CANCELADO" }),
    });
  });
});
