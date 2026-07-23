import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getHealthDocumentDetail,
  getHealthDocuments,
} from "@/lib/queries/documentos-saude";

const organizationId = "cm00000000000000000000301";
const documentId = "cm00000000000000000000302";

function session(): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: "cm00000000000000000000303",
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

const documentRow = {
  id: documentId,
  animalId: "animal-1",
  registroSaudeId: "record-1",
  tipo: "EXAME" as const,
  nomeArquivo: "exame.pdf",
  mimeType: "application/pdf",
  tamanhoBytes: 2048,
  urlArquivo: "https://files.example/internal/exame.pdf",
  criadoEm: new Date("2026-07-20T12:00:00.000Z"),
  animal: { id: "animal-1", nome: "Luna" },
};
const findDocuments = prisma.documentoSaude.findMany as unknown as {
  mockResolvedValue(value: Array<typeof documentRow>): void;
};
const findDocument = prisma.documentoSaude.findFirst as unknown as {
  mockResolvedValue(value: typeof documentRow | null): void;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(session());
});

describe("health document queries", () => {
  it("lists only documents belonging to owned animals", async () => {
    findDocuments.mockResolvedValue([documentRow]);

    const result = await getHealthDocuments({ animalId: "animal-1", tipo: "EXAME" });

    expect(result[0]).toMatchObject({
      id: documentId,
      nomeArquivo: "exame.pdf",
      openHref: "https://files.example/internal/exame.pdf",
    });
    const query = vi.mocked(prisma.documentoSaude.findMany).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).toContain(organizationId);
  });

  it("filters document detail by owner before returning the internal URL", async () => {
    findDocument.mockResolvedValue(documentRow);

    const result = await getHealthDocumentDetail(documentId);

    expect(result?.openHref).toBe("https://files.example/internal/exame.pdf");
    const query = vi.mocked(prisma.documentoSaude.findFirst).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).toContain(organizationId);
    expect(JSON.stringify(query)).toContain(documentId);
  });
});
