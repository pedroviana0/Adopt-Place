import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/dashboard/operacional/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000010001";
const organizacaoId = "cm00000000000000000010002";

function session(tipoPerfil: TipoPerfil = TipoPerfil.ORGANIZACAO): Session {
  return {
    expires: "2026-08-03T12:00:00.000Z",
    user: {
      id: userId,
      email: "responsavel@example.com",
      name: "Responsavel",
      image: null,
      tipoPerfil,
      ativo: true,
      adotanteId: tipoPerfil === TipoPerfil.ADOTANTE ? "adotante-1" : null,
      organizacaoId:
        tipoPerfil === TipoPerfil.ORGANIZACAO ? organizacaoId : null,
      acolhedorId: null,
    },
  };
}

function activeOrganization() {
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("operational dashboard HTTP contract", () => {
  it("returns 401 before reading dashboard data without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
    expect(prisma.solicitacaoAdocao.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 before reading dashboard data for a non-responsible role", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ADOTANTE));
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADOTANTE,
      organizacao: null,
      acolhedor: null,
    } as never);

    const response = await GET();

    expect(response.status).toBe(403);
    expect(prisma.animal.findMany).not.toHaveBeenCalled();
  });

  it("returns only aggregates scoped to the current responsible party", async () => {
    activeOrganization();
    vi.mocked(prisma.animal.findMany).mockResolvedValue([]);
    vi.mocked(prisma.solicitacaoAdocao.findMany).mockResolvedValue([]);
    vi.mocked(prisma.cuidadoPlanejado.findMany).mockResolvedValue([]);
    vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      dashboard: {
        indicators: {
          availableAnimals: { count: 0 },
          requestsWaitingReview: { count: 0 },
        },
      },
    });
    for (const query of [
      vi.mocked(prisma.animal.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.solicitacaoAdocao.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.cuidadoPlanejado.findMany).mock.calls[0]?.[0],
      vi.mocked(prisma.registroSaude.findMany).mock.calls[0]?.[0],
    ]) {
      expect(JSON.stringify(query)).toContain(organizacaoId);
    }
  });
});
