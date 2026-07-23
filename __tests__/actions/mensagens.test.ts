import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { markConversationRead, sendMensagem } from "@/lib/actions/mensagens";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000811";
const conversationId = "cm00000000000000000000812";

function session(): Session {
  return { expires: new Date(Date.now() + 60_000).toISOString(), user: { id: userId, email: "user@example.com", name: "User", image: null, tipoPerfil: TipoPerfil.ADOTANTE, ativo: true, adotanteId: "adopter-1", organizacaoId: null, acolhedorId: null } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("sendMensagem", () => {
  it.each(["   ", "a".repeat(2001)])("rejects invalid message text", async (texto) => {
    const result = await sendMensagem(conversationId, { texto });
    expect(result.error).toBeTruthy();
    expect(prisma.conversaParticipante.findUnique).not.toHaveBeenCalled();
    expect(prisma.mensagemAdocao.create).not.toHaveBeenCalled();
  });

  it("rejects nonexistent or unauthorized conversation", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue(null);
    await expect(sendMensagem(conversationId, { texto: "Ola" })).resolves.toEqual({ error: "Acesso negado" });
  });

  it("rejects archived conversation", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({ conversa: { status: "ARQUIVADA" } } as never);
    await expect(sendMensagem(conversationId, { texto: "Ola" })).resolves.toEqual({ error: "Conversa arquivada" });
    expect(prisma.mensagemAdocao.create).not.toHaveBeenCalled();
  });

  it("stores trimmed plain text for an active participant", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({ conversa: { status: "ATIVA" } } as never);
    await expect(sendMensagem(conversationId, { texto: "  Ola  " })).resolves.toEqual({ success: true });
    expect(prisma.mensagemAdocao.create).toHaveBeenCalledWith({ data: { conversaId: conversationId, autorUsuarioId: userId, texto: "Ola" } });
  });
});

describe("markConversationRead", () => {
  it("updates only the current participant read marker", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({ id: "participant-1" } as never);
    await expect(markConversationRead(conversationId)).resolves.toEqual({ success: true });
    expect(prisma.conversaParticipante.update).toHaveBeenCalledWith({
      where: { conversaId_usuarioId: { conversaId: conversationId, usuarioId: userId } },
      data: { ultimaLeituraEm: expect.any(Date) },
    });
  });
});
