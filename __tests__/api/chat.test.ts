import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listConversations } from "@/app/api/conversas/route";
import { GET as getConversation } from "@/app/api/conversas/[id]/route";
import { PATCH as markRead } from "@/app/api/conversas/[id]/leitura/route";
import { POST as sendMessage } from "@/app/api/conversas/[id]/mensagens/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000012001";
const conversationId = "cm00000000000000000012002";

function session(tipoPerfil: TipoPerfil = TipoPerfil.ADOTANTE): Session {
  return {
    expires: "2026-08-03T12:00:00.000Z",
    user: {
      id: userId,
      email: "participante@example.com",
      name: "Participante",
      image: null,
      tipoPerfil,
      ativo: true,
      adotanteId: tipoPerfil === TipoPerfil.ADOTANTE ? "adotante-1" : null,
      organizacaoId: null,
      acolhedorId: null,
    },
  };
}

function activeAdopter() {
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ADOTANTE,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chat HTTP contracts", () => {
  it("returns 401 before reading conversations without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listConversations(
      new Request("http://localhost/api/conversas"),
    );

    expect(response.status).toBe(401);
    expect(prisma.conversaParticipante.findMany).not.toHaveBeenCalled();
  });

  it("does not grant ADMIN implicit conversation access", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ADMIN));
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADMIN,
    } as never);

    const response = await listConversations(
      new Request("http://localhost/api/conversas"),
    );

    expect(response.status).toBe(403);
    expect(prisma.conversaParticipante.findMany).not.toHaveBeenCalled();
  });

  it("hides a conversation from a non-participant", async () => {
    activeAdopter();
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue(null);

    const response = await getConversation(new Request("http://localhost"), {
      params: Promise.resolve({ id: conversationId }),
    });

    expect(response.status).toBe(404);
  });

  it("rejects sends after adoption completion without persisting a message", async () => {
    activeAdopter();
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({
      conversa: { status: "ARQUIVADA" },
    } as never);

    const response = await sendMessage(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: "Ola" }),
      }),
      { params: Promise.resolve({ id: conversationId }) },
    );

    expect(response.status).toBe(409);
    expect(prisma.mensagemAdocao.create).not.toHaveBeenCalled();
  });

  it("stores a valid message for an active participant", async () => {
    activeAdopter();
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({
      conversa: { status: "ATIVA" },
    } as never);

    const response = await sendMessage(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: "  Ola  " }),
      }),
      { params: Promise.resolve({ id: conversationId }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.mensagemAdocao.create).toHaveBeenCalledWith({
      data: {
        conversaId: conversationId,
        autorUsuarioId: userId,
        texto: "Ola",
      },
    });
  });

  it("marks the conversation read only for the current participant", async () => {
    activeAdopter();
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({
      id: "participante-1",
    } as never);

    const response = await markRead(new Request("http://localhost"), {
      params: Promise.resolve({ id: conversationId }),
    });

    expect(response.status).toBe(200);
    expect(prisma.conversaParticipante.update).toHaveBeenCalledWith({
      where: {
        conversaId_usuarioId: { conversaId: conversationId, usuarioId: userId },
      },
      data: { ultimaLeituraEm: expect.any(Date) },
    });
  });
});
