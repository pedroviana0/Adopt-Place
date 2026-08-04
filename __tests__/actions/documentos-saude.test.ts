import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteDocumentoSaude } from "@/lib/actions/documentos-saude";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentoSaudeUploadSchema } from "@/lib/schemas/documento-saude";

const organizationId = "cm00000000000000000000601";
const documentId = "cm00000000000000000000602";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000603",
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

const findDocument = prisma.documentoSaude.findFirst as unknown as {
  mockResolvedValue(value: {
    id: string;
    chaveArquivo: string | null;
    animal: { organizacaoId: string | null; acolhedorId: string | null };
  } | null): void;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizationId },
    acolhedor: null,
  } as never);
});

describe("health document actions", () => {
  it("denies deletion when the document belongs to another responsible", async () => {
    findDocument.mockResolvedValue(null);

    await expect(deleteDocumentoSaude(documentId)).resolves.toEqual({
      error: "Documento nao encontrado",
    });
    expect(prisma.documentoSaude.delete).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(prisma.documentoSaude.findFirst).mock.calls[0]?.[0]))
      .toContain(organizationId);
  });

  it("rejects invalid upload metadata before persistence", () => {
    expect(
      documentoSaudeUploadSchema.safeParse({
        animalId: "cm00000000000000000000604",
        tipo: "EXAME",
        nomeArquivo: "arquivo.zip",
        mimeType: "application/zip",
        tamanhoBytes: 1024,
      }).success,
    ).toBe(false);
    expect(prisma.documentoSaude.create).not.toHaveBeenCalled();
  });

  it("deletes owned document metadata without changing health records", async () => {
    findDocument.mockResolvedValue({
      id: documentId,
      chaveArquivo: null,
      animal: { organizacaoId: organizationId, acolhedorId: null },
    });

    await expect(deleteDocumentoSaude(documentId)).resolves.toEqual({
      success: true,
    });
    expect(prisma.documentoSaude.delete).toHaveBeenCalledWith({
      where: { id: documentId },
    });
    expect(prisma.registroSaude.delete).not.toHaveBeenCalled();
  });
});
