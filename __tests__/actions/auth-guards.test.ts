import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string): never => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  AuthGuardError,
  requireRole,
  requireSession,
} from "@/lib/actions/auth-guards";
import { getServerSession } from "@/lib/auth";

function session(overrides: Partial<Session["user"]> = {}): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000020",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: "cm00000000000000000000021",
      acolhedorId: null,
      ...overrides,
    },
  };
}

const mockedGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth guard helpers", () => {
  describe("requireSession", () => {
    it("redirects unauthenticated users to /login", async () => {
      mockedGetServerSession.mockResolvedValue(null);

      await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/login");
      expect(redirectMock).toHaveBeenCalledWith("/login");
    });

    it("returns the specific inactive account message", async () => {
      mockedGetServerSession.mockResolvedValue(session({ ativo: false }));

      await expect(requireSession()).rejects.toThrow(
        "Conta desativada. Entre em contato com o administrador",
      );
    });

    it("returns the valid active session", async () => {
      const activeSession = session();
      mockedGetServerSession.mockResolvedValue(activeSession);

      await expect(requireSession()).resolves.toBe(activeSession);
    });
  });

  describe("requireRole", () => {
    it("throws forbidden error for the wrong role", () => {
      expect(() => requireRole(session({ tipoPerfil: TipoPerfil.ADOTANTE }), "ORGANIZACAO"))
        .toThrow(AuthGuardError);
      expect(() => requireRole(session({ tipoPerfil: TipoPerfil.ADOTANTE }), "ORGANIZACAO"))
        .toThrow("Acesso negado.");
    });

    it("passes for the correct role", () => {
      const activeSession = session({ tipoPerfil: TipoPerfil.ORGANIZACAO });

      expect(requireRole(activeSession, "ORGANIZACAO")).toBe(activeSession);
    });
  });
});
