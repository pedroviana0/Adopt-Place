import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  authorizeHealthDocumentUpload,
  createHealthDocumentCustomId,
  persistHealthDocumentUpload,
} from "@/lib/upload-router";

const organizationId = "cm00000000000000000000611";
const animalId = "cm00000000000000000000612";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000613",
      email: "org@example.com",
      name: "Organizacao",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId: organizationId,
      acolhedorId: null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("health document upload completion", () => {
  it("revalidates the active owner before authorizing an upload", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session());
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      ativo: true,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: { id: organizationId },
      acolhedor: null,
    } as never);
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId: organizationId,
      acolhedorId: null,
    } as never);

    await expect(
      authorizeHealthDocumentUpload(
        { animalId, tipoDocumento: "EXAME" },
        [{ name: "hemograma.pdf", size: 2048, type: "application/pdf" }],
      ),
    ).resolves.toMatchObject({
      responsavelId: organizationId,
      animalId,
      tipoDocumento: "EXAME",
    });
  });

  it("creates a unique provider identifier for each document", () => {
    expect(createHealthDocumentCustomId(animalId)).not.toBe(
      createHealthDocumentCustomId(animalId),
    );
  });

  it("rejects browser-provided ownership and unsupported file types", async () => {
    await expect(
      authorizeHealthDocumentUpload(
        {
          animalId,
          tipoDocumento: "EXAME",
          organizacaoId: "browser-controlled",
        },
        [{ name: "arquivo.zip", size: 2048, type: "application/zip" }],
      ),
    ).rejects.toThrow();
    expect(prisma.animal.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an apparent extension incompatible with the declared MIME", async () => {
    await expect(
      authorizeHealthDocumentUpload(
        { animalId, tipoDocumento: "EXAME" },
        [{ name: "hemograma.exe", size: 2048, type: "application/pdf" }],
      ),
    ).rejects.toThrow("extensão");
  });

  it("persists validated metadata after rechecking animal ownership", async () => {
    vi.mocked(prisma.animal.findUnique).mockResolvedValue({
      organizacaoId: "org-1",
      acolhedorId: null,
    } as never);
    vi.mocked(prisma.documentoSaude.create).mockResolvedValue({ id: "doc-1" } as never);

    await expect(
      persistHealthDocumentUpload(
        {
          userId: "user-1",
          responsavelId: "org-1",
          tipoPerfil: "ORGANIZACAO",
          animalId: "cm00000000000000000000604",
          tipoDocumento: "EXAME",
        },
        {
          name: "hemograma.pdf",
          size: 2048,
          type: "application/pdf",
          key: "provider-key",
          ufsUrl: "https://files.example/internal/hemograma.pdf",
        },
      ),
    ).resolves.toEqual({ id: "doc-1" });

    expect(prisma.documentoSaude.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        animalId: "cm00000000000000000000604",
        tipo: "EXAME",
        chaveArquivo: "provider-key",
        tamanhoBytes: 2048,
      }),
      select: { id: true },
    });
  });
});
