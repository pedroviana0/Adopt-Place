import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getVisaoGeral } from "@/app/api/saude/visao-geral/route";
import { GET as getAgenda } from "@/app/api/saude/agenda/route";
import { POST as createCuidado } from "@/app/api/saude/cuidados/route";
import { POST as concluirCuidado } from "@/app/api/saude/cuidados/[id]/concluir/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000009001";
const organizacaoId = "cm00000000000000000009002";
const animalId = "cm00000000000000000009003";
const careId = "cm00000000000000000009004";

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
      adotanteId: null,
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

describe("health center HTTP contracts (HEALTH-CENTER-01)", () => {
  it("returns 401 for the agenda when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await getAgenda(new Request("http://localhost/api/saude/agenda"));

    expect(response.status).toBe(401);
    expect(prisma.cuidadoPlanejado.findMany).not.toHaveBeenCalled();
  });

  it("blocks an adopter from registering a CONSULTA", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ADOTANTE));
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADOTANTE,
      organizacao: null,
      acolhedor: null,
    } as never);

    const response = await createCuidado(
      new Request("http://localhost/api/saude/cuidados", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animalId,
          dataHoraPlanejada: "2999-01-01T12:00:00.000Z",
          titulo: "Retorno",
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(prisma.cuidadoPlanejado.create).not.toHaveBeenCalled();
  });

  it("completes a CONSULTA without creating a health history record", async () => {
    activeOrganization();
    vi.mocked(prisma.cuidadoPlanejado.findUnique).mockResolvedValue({
      id: careId,
      status: "PENDENTE",
      animalId,
      tipo: "CONSULTA",
      animal: { organizacaoId, acolhedorId: null },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) =>
      (cb as (tx: typeof prisma) => unknown)(prisma),
    );
    vi.mocked(prisma.cuidadoPlanejado.updateMany).mockResolvedValue({ count: 1 } as never);

    const response = await concluirCuidado(
      new Request("http://localhost/api/saude/cuidados/x/concluir", { method: "POST" }),
      { params: Promise.resolve({ id: careId }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the planned care was already concluded (idempotency)", async () => {
    activeOrganization();
    vi.mocked(prisma.cuidadoPlanejado.findUnique).mockResolvedValue({
      id: careId,
      status: "PENDENTE",
      animalId,
      tipo: "CONSULTA",
      animal: { organizacaoId, acolhedorId: null },
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) =>
      (cb as (tx: typeof prisma) => unknown)(prisma),
    );
    vi.mocked(prisma.cuidadoPlanejado.updateMany).mockResolvedValue({ count: 0 } as never);

    const response = await concluirCuidado(
      new Request("http://localhost/api/saude/cuidados/x/concluir", { method: "POST" }),
      { params: Promise.resolve({ id: careId }) },
    );

    expect(response.status).toBe(409);
    expect(prisma.registroSaude.create).not.toHaveBeenCalled();
  });

  it("returns the owner-scoped overview", async () => {
    activeOrganization();
    vi.mocked(prisma.cuidadoPlanejado.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.animal.findMany).mockResolvedValue([] as never);

    const response = await getVisaoGeral();

    expect(response.status).toBe(200);
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizacaoId } }),
    );
  });
});
