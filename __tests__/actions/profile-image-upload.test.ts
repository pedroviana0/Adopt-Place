import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeProfileImageUpload,
  MAX_PROFILE_IMAGE_BYTES,
  persistProfileImageUpload,
} from "@/lib/upload-router";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockedSession = vi.mocked(getServerSession);
const findUser = vi.mocked(prisma.usuario.findUnique);
const updateOrganization = vi.mocked(prisma.organizacao.update);
const updateFoster = vi.mocked(prisma.acolhedorIndependente.update);

function session(tipoPerfil: TipoPerfil, ativo = true): Session {
  return {
    expires: "2026-08-01T12:00:00.000Z",
    user: {
      id: "user-1",
      email: "perfil@example.com",
      name: null,
      image: null,
      tipoPerfil,
      ativo,
      adotanteId: tipoPerfil === TipoPerfil.ADOTANTE ? "adopter-1" : null,
      organizacaoId: tipoPerfil === TipoPerfil.ORGANIZACAO ? "org-1" : null,
      acolhedorId: tipoPerfil === TipoPerfil.ACOLHEDOR ? "foster-1" : null,
    },
  };
}

const validFile = { name: "perfil.jpg", size: 1024, type: "image/jpeg" };

beforeEach(() => vi.clearAllMocks());

describe("profileImage Uploadthing authorization", () => {
  it("rejeita anonimo, adotante e conta inativa", async () => {
    for (const current of [null, session(TipoPerfil.ADOTANTE), session(TipoPerfil.ORGANIZACAO, false)]) {
      mockedSession.mockResolvedValue(current);
      await expect(authorizeProfileImageUpload({}, [validFile])).rejects.toThrow();
    }
  });

  it("rejeita input com alvo, quantidade, tipo e tamanho invalidos", async () => {
    mockedSession.mockResolvedValue(session(TipoPerfil.ORGANIZACAO));

    for (const [input, files] of [
      [{ profileId: "org-alheia" }, [validFile]],
      [{}, []],
      [{}, [validFile, validFile]],
      [{}, [{ ...validFile, type: "application/pdf" }]],
      [{}, [{ ...validFile, name: "perfil.txt" }]],
      [{}, [{ ...validFile, size: MAX_PROFILE_IMAGE_BYTES + 1 }]],
    ] as const) {
      await expect(authorizeProfileImageUpload(input, files)).rejects.toThrow();
    }
  });

  it("deriva o perfil da sessao sem aceitar identificador do navegador", async () => {
    mockedSession.mockResolvedValue(session(TipoPerfil.ORGANIZACAO));
    findUser.mockResolvedValue({
      id: "user-1",
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: "org-1" },
      acolhedor: null,
    } as never);

    await expect(authorizeProfileImageUpload({}, [validFile])).resolves.toEqual({
      userId: "user-1",
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      responsavelId: "org-1",
    });
  });
});

describe("profileImage Uploadthing completion", () => {
  it("revalida conta e persiste somente na organizacao da sessao", async () => {
    findUser.mockResolvedValue({
      id: "user-1",
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: "org-1" },
      acolhedor: null,
    } as never);
    updateOrganization.mockResolvedValue({ fotoUrl: "https://cdn.example.com/perfil.jpg" } as never);

    await expect(
      persistProfileImageUpload(
        { userId: "user-1", tipoPerfil: TipoPerfil.ORGANIZACAO, responsavelId: "org-1" },
        { ufsUrl: "https://cdn.example.com/perfil.jpg" },
      ),
    ).resolves.toEqual({ fotoUrl: "https://cdn.example.com/perfil.jpg" });

    expect(updateOrganization).toHaveBeenCalledWith({
      where: { id: "org-1" },
      data: { fotoUrl: "https://cdn.example.com/perfil.jpg" },
      select: { fotoUrl: true },
    });
    expect(updateFoster).not.toHaveBeenCalled();
  });

  it("persiste somente no acolhedor da sessao e bloqueia troca de perfil", async () => {
    findUser.mockResolvedValueOnce({
      id: "user-1",
      ativo: true,
      tipoPerfil: TipoPerfil.ACOLHEDOR,
      organizacao: null,
      acolhedor: { id: "foster-1" },
    } as never);
    updateFoster.mockResolvedValue({ fotoUrl: "https://cdn.example.com/foster.jpg" } as never);

    await persistProfileImageUpload(
      { userId: "user-1", tipoPerfil: TipoPerfil.ACOLHEDOR, responsavelId: "foster-1" },
      { ufsUrl: "https://cdn.example.com/foster.jpg" },
    );
    expect(updateFoster).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foster-1" } }));

    findUser.mockResolvedValueOnce({
      id: "user-1",
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: "org-2" },
      acolhedor: null,
    } as never);
    await expect(
      persistProfileImageUpload(
        { userId: "user-1", tipoPerfil: TipoPerfil.ORGANIZACAO, responsavelId: "org-1" },
        { ufsUrl: "https://cdn.example.com/attack.jpg" },
      ),
    ).rejects.toThrow();
  });
});
