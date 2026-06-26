import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setUserActive } from "@/lib/actions/admin-users";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000000010";

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000011",
      email: "admin@example.com",
      name: "Admin",
      image: null,
      tipoPerfil: TipoPerfil.ADMIN,
      ativo: true,
      adotanteId: null,
      organizacaoId: null,
      acolhedorId: null,
      ...overrides,
    },
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);
const updateUser = prisma.usuario.update as unknown as {
  mockResolvedValue(value: { id: string; ativo: boolean }): void;
};

beforeEach(() => {
  vi.clearAllMocks();
  updateUser.mockResolvedValue({ id: userId, ativo: true });
});

describe("setUserActive", () => {
  it("returns an error for non-admin users and prevents privilege escalation", async () => {
    mockedGetServerSession.mockResolvedValue(
      session({
        tipoPerfil: TipoPerfil.ADOTANTE,
        adotanteId: "cm00000000000000000000012",
      }),
    );

    const result = await setUserActive({ userId, ativo: false });

    expect(result.error).toBe("Acesso negado");
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it("returns an error for organization users", async () => {
    mockedGetServerSession.mockResolvedValue(
      session({
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        organizacaoId: "cm00000000000000000000013",
      }),
    );

    const result = await setUserActive({ userId, ativo: false });

    expect(result.error).toBe("Acesso negado");
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it("deactivates a user when called by an admin", async () => {
    mockedGetServerSession.mockResolvedValue(session());

    const result = await setUserActive({ userId, ativo: false });

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { ativo: false },
    });
    expect(result).toEqual({ success: true });
  });

  it("reactivates a user when called by an admin", async () => {
    mockedGetServerSession.mockResolvedValue(session());

    const result = await setUserActive({ userId, ativo: true });

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { ativo: true },
    });
    expect(result).toEqual({ success: true });
  });

  it("validates input with setUserActiveSchema before updating", async () => {
    mockedGetServerSession.mockResolvedValue(session());

    const result = await setUserActive({ userId: "invalid-id", ativo: true });

    expect(result.error).toBe("Identificador invalido.");
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });
});
