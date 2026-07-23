import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { persistHealthDocumentUpload } from "@/lib/upload-router";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("health document upload completion", () => {
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
