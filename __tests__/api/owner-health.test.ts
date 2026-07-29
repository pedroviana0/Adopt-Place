import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as listHealth,
  POST as createHealth,
} from "@/app/api/animais/gerenciados/[id]/saude/route";
import {
  DELETE as deleteHealth,
} from "@/app/api/animais/gerenciados/[id]/saude/[registroId]/route";
import { GET as listHealthAlerts } from "@/app/api/saude/alertas/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000002001";
const organizacaoId = "cm00000000000000000002002";
const animalId = "cm00000000000000000002003";
const recordId = "cm00000000000000000002004";

function session(tipoPerfil: TipoPerfil = TipoPerfil.ORGANIZACAO): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: userId,
      email: "responsavel@example.com",
      name: "Responsavel",
      image: null,
      tipoPerfil,
      ativo: true,
      adotanteId: tipoPerfil === TipoPerfil.ADOTANTE ? organizacaoId : null,
      organizacaoId: tipoPerfil === TipoPerfil.ORGANIZACAO ? organizacaoId : null,
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

describe("owner health HTTP contracts", () => {
  it("returns 401 before reading clinical records when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listHealth(new Request("http://localhost"), {
      params: Promise.resolve({ id: animalId }),
    });

    expect(response.status).toBe(401);
    expect(prisma.registroSaude.findMany).not.toHaveBeenCalled();
  });

  it("blocks an adopter before reading or mutating health data", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ADOTANTE));
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADOTANTE,
      organizacao: null,
      acolhedor: null,
    } as never);

    const response = await createHealth(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipoRegistro: "PROCEDIMENTO",
          procedimento: "Castracao",
          dataAplicacao: "2026-07-20T12:00:00.000Z",
        }),
      }),
      { params: Promise.resolve({ id: animalId }) },
    );

    expect(response.status).toBe(403);
    expect(prisma.animal.findFirst).not.toHaveBeenCalled();
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
  });

  it("rejects a future application date without writing", async () => {
    activeOrganization();

    const response = await createHealth(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipoRegistro: "PROCEDIMENTO",
          procedimento: "Castracao",
          dataAplicacao: "2999-07-20T12:00:00.000Z",
        }),
      }),
      { params: Promise.resolve({ id: animalId }) },
    );

    expect(response.status).toBe(400);
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
  });

  it("does not accept CONSULTA as a clinical-history category", async () => {
    activeOrganization();

    const response = await createHealth(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipoRegistro: "CONSULTA",
          dataAplicacao: "2026-07-20T12:00:00.000Z",
        }),
      }),
      { params: Promise.resolve({ id: animalId }) },
    );

    expect(response.status).toBe(400);
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
  });

  it("deletes pending derived care and the owned record in one transaction", async () => {
    activeOrganization();
    vi.mocked(prisma.registroSaude.findFirst).mockResolvedValue({
      id: recordId,
      animalId,
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma as never),
    );

    const response = await deleteHealth(new Request("http://localhost"), {
      params: Promise.resolve({ id: animalId, registroId: recordId }),
    });

    expect(response.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.cuidadoPlanejado.deleteMany).toHaveBeenCalledBefore(
      vi.mocked(prisma.registroSaude.delete),
    );
  });

  it("scopes alerts to the current owner and includes procedures", async () => {
    activeOrganization();
    vi.mocked(prisma.registroSaude.findMany).mockResolvedValue([]);

    const response = await listHealthAlerts();

    expect(response.status).toBe(200);
    expect(prisma.registroSaude.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tipo: {
            in: ["VACINA", "CONTROLE_PARASITAS", "PROCEDIMENTO"],
          },
          animal: { organizacaoId },
        }),
      }),
    );
  });
});
