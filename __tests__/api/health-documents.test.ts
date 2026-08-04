import { TipoPerfil } from "@prisma/client";
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listDocuments } from "@/app/api/saude/documentos/route";
import {
  DELETE as deleteDocument,
  GET as getDocument,
} from "@/app/api/saude/documentos/[id]/route";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userId = "cm00000000000000000011001";
const organizacaoId = "cm00000000000000000011002";
const animalId = "cm00000000000000000011003";
const documentId = "cm00000000000000000011004";

function session(): Session {
  return {
    expires: "2026-08-03T12:00:00.000Z",
    user: {
      id: userId,
      email: "responsavel@example.com",
      name: "Responsavel",
      image: null,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      adotanteId: null,
      organizacaoId,
      acolhedorId: null,
    },
  };
}

function activeOrganization() {
  vi.mocked(getServerSession).mockResolvedValue(session());
  vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
    ativo: true,
    tipoPerfil: TipoPerfil.ORGANIZACAO,
    organizacao: { id: organizacaoId },
    acolhedor: null,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("health document HTTP contracts", () => {
  it("returns 401 before reading private documents without a session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await listDocuments(
      new Request("http://localhost/api/saude/documentos"),
    );

    expect(response.status).toBe(401);
    expect(prisma.documentoSaude.findMany).not.toHaveBeenCalled();
  });

  it("scopes document detail before returning its internal URL", async () => {
    activeOrganization();
    vi.mocked(prisma.documentoSaude.findFirst).mockResolvedValue(null);

    const response = await getDocument(new Request("http://localhost"), {
      params: Promise.resolve({ id: documentId }),
    });

    expect(response.status).toBe(404);
    const query = vi.mocked(prisma.documentoSaude.findFirst).mock.calls[0]?.[0];
    expect(JSON.stringify(query)).toContain(organizacaoId);
    expect(JSON.stringify(query)).toContain(documentId);
  });

  it("returns an allowlisted private DTO without the provider key", async () => {
    activeOrganization();
    vi.mocked(prisma.documentoSaude.findMany).mockResolvedValue([
      {
        id: documentId,
        animalId,
        registroSaudeId: null,
        tipo: "EXAME",
        nomeArquivo: "hemograma.pdf",
        mimeType: "application/pdf",
        tamanhoBytes: 2048,
        urlArquivo: "https://files.example/internal/hemograma.pdf",
        criadoEm: new Date("2026-08-03T10:00:00.000Z"),
        animal: { id: animalId, nome: "Luna" },
        registroSaude: null,
      },
    ] as never);

    const response = await listDocuments(
      new Request(`http://localhost/api/saude/documentos?animalId=${animalId}`),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.documents[0]).toMatchObject({
      id: documentId,
      openHref: "https://files.example/internal/hemograma.pdf",
    });
    expect(JSON.stringify(body)).not.toContain("chaveArquivo");
  });

  it("does not delete a document owned by another responsible party", async () => {
    activeOrganization();
    vi.mocked(prisma.documentoSaude.findFirst).mockResolvedValue(null);

    const response = await deleteDocument(new Request("http://localhost"), {
      params: Promise.resolve({ id: documentId }),
    });

    expect(response.status).toBe(404);
    expect(prisma.documentoSaude.delete).not.toHaveBeenCalled();
  });
});
