import { TipoPerfil } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeCredentials,
  INACTIVE_ACCOUNT_MESSAGE,
} from "@/lib/auth-credentials";
import { prisma } from "@/lib/prisma";

type CredentialUser = {
  id: string;
  email: string;
  senhaHash: string;
  tipoPerfil: TipoPerfil;
  ativo: boolean;
  criadoEm: Date;
  adotante: { id: string } | null;
  organizacao: { id: string } | null;
  acolhedor: { id: string } | null;
};

const findUser = prisma.usuario.findUnique as unknown as {
  mockResolvedValue(value: CredentialUser | null): void;
};

const activeOrganization: CredentialUser = {
  id: "user-1",
  email: "org@example.com",
  senhaHash: hashSync("valid-password", 4),
  tipoPerfil: TipoPerfil.ORGANIZACAO,
  ativo: true,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  adotante: null,
  organizacao: { id: "org-1" },
  acolhedor: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("credentials authorization", () => {
  it("authenticates valid credentials and returns only session-safe identity fields", async () => {
    findUser.mockResolvedValue(activeOrganization);

    const result = await authorizeCredentials({
      email: " ORG@EXAMPLE.COM ",
      password: "valid-password",
    });

    expect(result).toEqual({
      id: "user-1",
      email: "org@example.com",
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: "org-1",
      acolhedorId: null,
    });
    expect(result).not.toHaveProperty("senhaHash");
    expect(result).not.toHaveProperty("criadoEm");
  });

  it("rejects invalid credentials without exposing whether the account exists", async () => {
    findUser.mockResolvedValue(activeOrganization);

    await expect(
      authorizeCredentials({
        email: "org@example.com",
        password: "wrong-password",
      }),
    ).resolves.toBeNull();
  });

  it("blocks an inactive account before comparing its password", async () => {
    findUser.mockResolvedValue({
      ...activeOrganization,
      ativo: false,
    });

    await expect(
      authorizeCredentials({
        email: "org@example.com",
        password: "valid-password",
      }),
    ).rejects.toThrow(INACTIVE_ACCOUNT_MESSAGE);
  });
});
