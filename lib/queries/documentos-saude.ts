import { Prisma, TipoDocumentoSaude, TipoPerfil } from "@prisma/client";

import { requireResponsible } from "@/lib/actions/auth-guards";
import type { ResponsibleContext } from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";

type ResponsibleSession = Awaited<ReturnType<typeof requireResponsible>>;
type ResponsibleOwner = ResponsibleSession | ResponsibleContext;

function ownedAnimalWhere(owner: ResponsibleOwner): Prisma.AnimalWhereInput {
  if ("user" in owner) {
    if (owner.user.tipoPerfil === TipoPerfil.ORGANIZACAO) {
      return { organizacaoId: owner.user.organizacaoId! };
    }
    return { acolhedorId: owner.user.acolhedorId! };
  }

  return owner.tipoPerfil === TipoPerfil.ORGANIZACAO
    ? { organizacaoId: owner.responsavelId }
    : { acolhedorId: owner.responsavelId };
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

export async function getHealthDocuments(
  filters: HealthDocumentFilters = {},
  responsible?: ResponsibleContext,
) {
  const owner = responsible ?? (await requireResponsible());
  const documents = await prisma.documentoSaude.findMany({
    where: {
      animal: ownedAnimalWhere(owner),
      ...(filters.animalId ? { animalId: filters.animalId } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
    },
    orderBy: { criadoEm: "desc" },
    select: documentSelect,
  });

  return documents.map(mapDocument);
}

export async function getHealthDocumentDetail(
  documentId: string,
  responsible?: ResponsibleContext,
) {
  const owner = responsible ?? (await requireResponsible());
  const document = await prisma.documentoSaude.findFirst({
    where: {
      id: documentId,
      animal: ownedAnimalWhere(owner),
    },
    select: documentSelect,
  });

  return document ? mapDocument(document) : null;
}

export type HealthDocument = Awaited<
  ReturnType<typeof getHealthDocuments>
>[number];
