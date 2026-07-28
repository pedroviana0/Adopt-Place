import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/session/route";
import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CurrentUser = {
  id: string;
  email: string;
  tipoPerfil: TipoPerfil;
  ativo: boolean;
  adotante: { id: string } | null;
  organizacao: { id: string } | null;
  acolhedor: { id: string } | null;
};

const findCurrentUser = prisma.usuario.findUnique as unknown as {
  mockResolvedValue(value: CurrentUser | null): void;
};
const mockedGetServerSession = vi.mocked(getServerSession);

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: "user-1",
      email: "stale@example.com",
      name: "Stale session name",
      image: "https://example.com/private-image.jpg",
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: "stale-org-id",
      acolhedorId: null,
      ...overrides,
    },
  };
}

const activeOrganization: CurrentUser = {
  id: "user-1",
  email: "org@example.com",
  tipoPerfil: TipoPerfil.ORGANIZACAO,
  ativo: true,
  adotante: null,
  organizacao: { id: "org-1" },
  acolhedor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/session", () => {
  it("returns the current safe SessionDTO for an authenticated active user", async () => {
    mockedGetServerSession.mockResolvedValue(session());
    findCurrentUser.mockResolvedValue(activeOrganization);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        email: true,
        tipoPerfil: true,
        ativo: true,
        adotante: { select: { id: true } },
        organizacao: { select: { id: true } },
        acolhedor: { select: { id: true } },
      },
    });
    expect(body).toEqual({
      user: {
        id: "user-1",
        email: "org@example.com",
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        ativo: true,
        adotanteId: null,
        organizacaoId: "org-1",
        acolhedorId: null,
      },
      expires: "2026-08-01T12:00:00.000Z",
    });

    const serialized = JSON.stringify(body);
    for (const excludedField of [
      "senhaHash",
      "cpf",
      "cnpj",
      "telefone",
      "endereco",
      "triagemConcluida",
      "motivoAdocao",
      "token",
      "image",
      "name",
    ]) {
      expect(serialized).not.toContain(excludedField);
    }
  });

  it("returns 401 without reading user data when there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Autenticacao necessaria.",
      },
    });
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("blocks a user whose current database account is inactive", async () => {
    mockedGetServerSession.mockResolvedValue(session({ ativo: true }));
    findCurrentUser.mockResolvedValue({
      ...activeOrganization,
      ativo: false,
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INACTIVE_ACCOUNT",
        message: INACTIVE_ACCOUNT_MESSAGE,
      },
    });
  });
});
