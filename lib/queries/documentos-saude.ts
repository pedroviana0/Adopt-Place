import { Prisma, TipoDocumentoSaude, TipoPerfil } from "@prisma/client";

import { requireResponsible } from "@/lib/actions/auth-guards";
import { prisma } from "@/lib/prisma";

type ResponsibleSession = Awaited<ReturnType<typeof requireResponsible>>;

function ownedAnimalWhere(session: ResponsibleSession): Prisma.AnimalWhereInput {
  if (session.user.tipoPerfil === TipoPerfil.ORGANIZACAO) {
    return { organizacaoId: session.user.organizacaoId! };
  }

  return { acolhedorId: session.user.acolhedorId! };
}

const documentSelect = {
  id: true,
  animalId: true,
  registroSaudeId: true,
  tipo: true,
  nomeArquivo: true,
  mimeType: true,
  tamanhoBytes: true,
  urlArquivo: true,
  criadoEm: true,
  animal: { select: { id: true, nome: true } },
  registroSaude: {
    select: { id: true, tipo: true, titulo: true, dataRegistro: true },
  },
} satisfies Prisma.DocumentoSaudeSelect;

type DocumentRow = Prisma.DocumentoSaudeGetPayload<{
  select: typeof documentSelect;
}>;

function mapDocument(document: DocumentRow) {
  return {
    id: document.id,
    animalId: document.animalId,
    animal: {
      ...document.animal,
      href: `/dashboard/animais/${document.animalId}/saude`,
    },
    registroSaudeId: document.registroSaudeId,
    registroSaude: document.registroSaude,
    tipo: document.tipo,
    nomeArquivo: document.nomeArquivo,
    mimeType: document.mimeType,
    tamanhoBytes: document.tamanhoBytes,
    criadoEm: document.criadoEm,
    openHref: document.urlArquivo,
  };
}

export type HealthDocumentFilters = {
  animalId?: string;
  tipo?: TipoDocumentoSaude;
};

export async function getHealthDocuments(filters: HealthDocumentFilters = {}) {
  const session = await requireResponsible();
  const documents = await prisma.documentoSaude.findMany({
    where: {
      animal: ownedAnimalWhere(session),
      ...(filters.animalId ? { animalId: filters.animalId } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
    },
    orderBy: { criadoEm: "desc" },
    select: documentSelect,
  });

  return documents.map(mapDocument);
}

export async function getHealthDocumentDetail(documentId: string) {
  const session = await requireResponsible();
  const document = await prisma.documentoSaude.findFirst({
    where: {
      id: documentId,
      animal: ownedAnimalWhere(session),
    },
    select: documentSelect,
  });

  return document ? mapDocument(document) : null;
}

export type HealthDocument = Awaited<
  ReturnType<typeof getHealthDocuments>
>[number];
