import { StatusSolicitacao, TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as listOwnerRequests,
} from "@/app/api/solicitacoes/gerenciadas/route";
import {
  GET as getOwnerRequest,
  PATCH as decideOwnerRequest,
} from "@/app/api/solicitacoes/gerenciadas/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000001001";
const organizacaoId = "cm00000000000000000001002";
const requestId = "cm00000000000000000001003";
const animalId = "cm00000000000000000001004";

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

describe("owner request HTTP contracts", () => {
  it("returns 401 before reading requests when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listOwnerRequests(
      new Request("http://localhost/api/solicitacoes/gerenciadas"),
    );

    expect(response.status).toBe(401);
    expect(prisma.solicitacaoAdocao.findMany).not.toHaveBeenCalled();
  });

  it("blocks an account deactivated after session issuance", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: false,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizacaoId },
      acolhedor: null,
    } as never);

    const response = await listOwnerRequests(
      new Request("http://localhost/api/solicitacoes/gerenciadas"),
    );

    expect(response.status).toBe(403);
    expect(prisma.solicitacaoAdocao.findMany).not.toHaveBeenCalled();
  });

  it("scopes the detail query before selecting private screening data", async () => {
    activeOrganization();
    vi.mocked(prisma.solicitacaoAdocao.findFirst).mockResolvedValue(null);

    const response = await getOwnerRequest(new Request("http://localhost"), {
      params: Promise.resolve({ id: requestId }),
    });

    expect(response.status).toBe(404);
    expect(prisma.solicitacaoAdocao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: requestId,
          animal: { organizacaoId },
        },
      }),
    );
    expect(prisma.solicitacaoAdocao.findUnique).not.toHaveBeenCalled();
  });

  it("returns an allowlisted screening DTO without CPF or street address", async () => {
    activeOrganization();
    vi.mocked(prisma.solicitacaoAdocao.findFirst).mockResolvedValue({
      id: requestId,
      status: StatusSolicitacao.EM_ANALISE,
      dataSolicitacao: new Date("2026-07-20T12:00:00.000Z"),
      dataAtualizacao: new Date("2026-07-20T12:00:00.000Z"),
      observacoes: null,
      animal: { id: animalId, nome: "Luna" },
      adotante: {
        id: "adopter-1",
        nomeCompleto: "Ana",
        telefone: "11999999999",
        cidade: "Sao Paulo",
        estado: "SP",
        triagemConcluida: true,
      },
    } as never);

    const response = await getOwnerRequest(new Request("http://localhost"), {
      params: Promise.resolve({ id: requestId }),
    });
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(200);
    expect(serialized).toContain("triagemConcluida");
    expect(serialized).not.toContain("cpf");
    expect(serialized).not.toContain("endereco");
    expect(serialized).not.toContain("usuarioId");
  });

  it("rejects a repeated decision without starting a transaction", async () => {
    activeOrganization();
    vi.mocked(prisma.solicitacaoAdocao.findFirst).mockResolvedValue({
      id: requestId,
      animalId,
      status: StatusSolicitacao.APROVADA,
      adotante: { usuarioId: "adopter-user" },
      animal: { id: animalId, organizacaoId, acolhedorId: null },
    } as never);

    const response = await decideOwnerRequest(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "RECUSADA" }),
      }),
      { params: Promise.resolve({ id: requestId }) },
    );

    expect(response.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
