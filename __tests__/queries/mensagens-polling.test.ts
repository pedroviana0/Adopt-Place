import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/mensagens/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000821";
const conversationId = "cm00000000000000000000822";

function session(): Session {
  return { expires: new Date(Date.now() + 60_000).toISOString(), user: { id: userId, email: "user@example.com", name: "User", image: null, tipoPerfil: TipoPerfil.ADOTANTE, ativo: true, adotanteId: "adopter-1", organizacaoId: null, acolhedorId: null } };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ADOTANTE,
  } as never);
});

describe("message polling route", () => {
  it("returns plain messages after the cursor for a participant", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue({ conversa: { status: "ATIVA" } } as never);
    vi.mocked(prisma.mensagemAdocao.findMany).mockResolvedValue([{ id: "m1", texto: "<b>texto</b>", criadaEm: new Date("2026-07-22T12:00:00Z"), autorUsuarioId: "other" }] as never);
    const request = new NextRequest(`http://localhost/api/mensagens/${conversationId}?after=2026-07-22T10:00:00.000Z`);
    const response = await GET(request, { params: Promise.resolve({ id: conversationId }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      messages: [{ text: "<b>texto</b>", authorIsMe: false }],
      status: "ATIVA",
    });
    expect(JSON.stringify(body)).not.toContain("autorUsuarioId");
    expect(JSON.stringify(vi.mocked(prisma.mensagemAdocao.findMany).mock.calls[0]?.[0])).toContain("2026-07-22");
  });

  it("denies a non-participant", async () => {
    vi.mocked(prisma.conversaParticipante.findUnique).mockResolvedValue(null);
    const response = await GET(new NextRequest(`http://localhost/api/mensagens/${conversationId}`), { params: Promise.resolve({ id: conversationId }) });
    expect(response.status).toBe(404);
  });

  it("blocks an account deactivated after the session was issued", async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: false,
      tipoPerfil: TipoPerfil.ADOTANTE,
    } as never);

    const response = await GET(
      new NextRequest(`http://localhost/api/mensagens/${conversationId}`),
      { params: Promise.resolve({ id: conversationId }) },
    );

    expect(response.status).toBe(403);
    expect(prisma.conversaParticipante.findUnique).not.toHaveBeenCalled();
  });
});
