import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listUsers } from "@/app/api/admin/usuarios/route";
import { PATCH as setActive } from "@/app/api/admin/usuarios/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminId = "cm00000000000000000008001";
const targetId = "cm00000000000000000008002";

function session(tipoPerfil: TipoPerfil = TipoPerfil.ADMIN, ativo = true): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: adminId,
      email: "admin@example.com",
      name: "Admin",
      image: null,
      tipoPerfil,
      ativo,
      adotanteId: null,
      organizacaoId: null,
      acolhedorId: null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin users HTTP contracts (ADMIN-01)", () => {
  it("returns 401 for the user list without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listUsers();

    expect(response.status).toBe(401);
    expect(prisma.usuario.findMany).not.toHaveBeenCalled();
  });

  it("blocks a non-admin from listing users", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session(TipoPerfil.ORGANIZACAO));
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
    } as never);

    const response = await listUsers();

    expect(response.status).toBe(403);
    expect(prisma.usuario.findMany).not.toHaveBeenCalled();
  });

  it("lists users for an active admin without exposing password hashes", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADMIN,
    } as never);
    vi.mocked(prisma.usuario.findMany).mockResolvedValue([
      {
        id: targetId,
        email: "user@example.com",
        tipoPerfil: TipoPerfil.ADOTANTE,
        ativo: true,
        criadoEm: new Date("2026-07-01T12:00:00.000Z"),
      },
    ] as never);

    const response = await listUsers();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.users).toHaveLength(1);
    expect(payload.users[0]).not.toHaveProperty("senhaHash");
    // The query select must not request the password hash.
    const selectArg = vi.mocked(prisma.usuario.findMany).mock.calls[0]?.[0];
    expect(selectArg?.select).not.toHaveProperty("senhaHash");
  });

  it("toggles a user's active state for an admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ADMIN,
    } as never);
    vi.mocked(prisma.usuario.update).mockResolvedValue({ id: targetId } as never);

    const response = await setActive(
      new Request("http://localhost/api/admin/usuarios/x", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ativo: false }),
      }),
      { params: Promise.resolve({ id: targetId }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { ativo: false },
    });
  });
});
