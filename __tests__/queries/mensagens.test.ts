import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConversationDetail, getConversationList, getUnreadMessageCount } from "@/lib/queries/mensagens";

const userId = "cm00000000000000000000801";
const conversationId = "cm00000000000000000000802";

function session(role: TipoPerfil = TipoPerfil.ADOTANTE): Session {
  return { expires: new Date(Date.now() + 60_000).toISOString(), user: { id: userId, email: "user@example.com", name: "User", image: null, tipoPerfil: role, ativo: true, adotanteId: role === TipoPerfil.ADOTANTE ? "adopter-1" : null, organizacaoId: null, acolhedorId: null } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("message queries", () => {
  it("lists only conversations where the current user is a participant", async () => {
    vi.mocked(prisma.conversaParticipante.findMany).mockResolvedValue([]);
    await expect(getConversationList({ status: "ativas" })).resolves.toEqual([]);
    const query = vi.mocked(prisma.conversaParticipante.findMany).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).toContain(userId);
    expect(JSON.stringify(query)).toContain("ATIVA");
  });

  it("denies detail to non-participants and does not grant ADMIN access", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue(null);
    await expect(getConversationDetail(conversationId)).rejects.toThrow("Acesso negado");
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ADMIN));
    await expect(getConversationList()).rejects.toThrow("Acesso negado");
  });

  it("counts received messages newer than each participant read marker", async () => {
    vi.mocked(prisma.conversaParticipante.findMany).mockResolvedValue([
      { conversaId: conversationId, ultimaLeituraEm: new Date("2026-07-22T10:00:00Z") },
    ] as never);
    vi.mocked(prisma.mensagemAdocao.findMany).mockResolvedValue([
      { conversaId: conversationId, criadaEm: new Date("2026-07-22T09:00:00Z") },
      { conversaId: conversationId, criadaEm: new Date("2026-07-22T11:00:00Z") },
    ] as never);
    await expect(getUnreadMessageCount()).resolves.toBe(1);
  });
});
