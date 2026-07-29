import { TipoPerfil } from "@prisma/client";
import { createUploadthing, type FileRouter, UTFiles } from "uploadthing/next";
import { TipoDocumentoSaude } from "@prisma/client";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { persistAnimalPhotoUpload } from "@/lib/actions/fotos";
import {
  getResponsibleContext,
  ownsAnimal,
} from "@/lib/api/responsible-context";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_HEALTH_DOCUMENT_BYTES,
  documentoSaudeUploadSchema,
} from "@/lib/schemas/documento-saude";

const f = createUploadthing();

const animalPhotoInputSchema = z.object({
  animalId: z.string().cuid(),
});

const healthDocumentInputSchema = z.object({
  animalId: z.string().cuid(),
  registroSaudeId: z.string().cuid().optional(),
  tipoDocumento: z.nativeEnum(TipoDocumentoSaude),
});

type ResponsibleRole = typeof TipoPerfil.ORGANIZACAO | typeof TipoPerfil.ACOLHEDOR;

function isResponsibleRole(tipoPerfil: TipoPerfil): tipoPerfil is ResponsibleRole {
  return tipoPerfil === TipoPerfil.ORGANIZACAO || tipoPerfil === TipoPerfil.ACOLHEDOR;
}

function getResponsavelId(
  tipoPerfil: ResponsibleRole,
  sessionUser: {
    organizacaoId: string | null;
    acolhedorId: string | null;
  },
): string | null {
  return tipoPerfil === TipoPerfil.ORGANIZACAO
    ? sessionUser.organizacaoId
    : sessionUser.acolhedorId;
}

type HealthUploadMetadata = {
  userId: string;
  responsavelId: string;
  tipoPerfil: ResponsibleRole;
  animalId: string;
  registroSaudeId?: string;
  tipoDocumento: TipoDocumentoSaude;
};

type UploadedHealthFile = {
  name: string;
  size: number;
  type: string;
  key: string;
  ufsUrl: string;
};

export async function persistHealthDocumentUpload(
  metadata: HealthUploadMetadata,
  file: UploadedHealthFile,
) {
  const parsed = documentoSaudeUploadSchema.safeParse({
    animalId: metadata.animalId,
    registroSaudeId: metadata.registroSaudeId,
    tipo: metadata.tipoDocumento,
    nomeArquivo: file.name,
    mimeType: file.type,
    tamanhoBytes: file.size,
  });

  if (!parsed.success) {
    throw new UploadThingError(parsed.error.issues[0]?.message ?? "Bad Request");
  }

  const animal = await prisma.animal.findUnique({
    where: { id: parsed.data.animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });
  const stillOwned =
    metadata.tipoPerfil === TipoPerfil.ORGANIZACAO
      ? animal?.organizacaoId === metadata.responsavelId
      : animal?.acolhedorId === metadata.responsavelId;

  if (!stillOwned) throw new UploadThingError("Forbidden");

  if (parsed.data.registroSaudeId) {
    const record = await prisma.registroSaude.findUnique({
      where: { id: parsed.data.registroSaudeId },
      select: { animalId: true },
    });
    if (!record || record.animalId !== parsed.data.animalId) {
      throw new UploadThingError("Bad Request");
    }
  }

  return prisma.documentoSaude.create({
    data: {
      animalId: parsed.data.animalId,
      registroSaudeId: parsed.data.registroSaudeId ?? null,
      tipo: parsed.data.tipo,
      nomeArquivo: parsed.data.nomeArquivo,
      mimeType: parsed.data.mimeType,
      tamanhoBytes: parsed.data.tamanhoBytes,
      urlArquivo: file.ufsUrl,
      chaveArquivo: file.key,
    },
    select: { id: true },
  });
}

export const uploadRouter = {
  animalPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .input(animalPhotoInputSchema)
    .middleware(async ({ files, input }) => {
      const current = await getResponsibleContext();
      if ("error" in current) {
        throw new UploadThingError(
          current.error.status === 401 ? "Unauthorized" : "Forbidden",
        );
      }

      const animal = await prisma.animal.findUnique({
        where: { id: input.animalId },
        select: {
          organizacaoId: true,
          acolhedorId: true,
        },
      });

      if (!ownsAnimal(current.context, animal)) {
        throw new UploadThingError("Forbidden");
      }

      return {
        userId: current.context.userId,
        organizacaoId: current.context.organizacaoId,
        acolhedorId: current.context.acolhedorId,
        animalId: input.animalId,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: input.animalId,
        })),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const photo = await persistAnimalPhotoUpload(metadata, { url: file.url });
        return {
          photoId: photo.id,
          uploadedBy: metadata.userId,
          animalId: metadata.animalId,
        };
      } catch (error) {
        throw new UploadThingError(
          error instanceof Error ? error.message : "Upload failed",
        );
      }
    }),
  healthDocument: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(healthDocumentInputSchema)
    .middleware(async ({ files, input }) => {
      if (files.some((file) => file.size > MAX_HEALTH_DOCUMENT_BYTES)) {
        throw new UploadThingError("Arquivo deve ter no maximo 10 MB");
      }

      const session = await getServerSession();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      if (!session.user.ativo || !isResponsibleRole(session.user.tipoPerfil)) {
        throw new UploadThingError("Forbidden");
      }

      const responsavelId = getResponsavelId(session.user.tipoPerfil, session.user);
      if (!responsavelId) {
        throw new UploadThingError("Forbidden");
      }

      const animal = await prisma.animal.findUnique({
        where: { id: input.animalId },
        select: { organizacaoId: true, acolhedorId: true },
      });
      const ownsAnimal =
        session.user.tipoPerfil === TipoPerfil.ORGANIZACAO
          ? animal?.organizacaoId === responsavelId
          : animal?.acolhedorId === responsavelId;

      if (!ownsAnimal) {
        throw new UploadThingError("Forbidden");
      }

      if (input.registroSaudeId) {
        const record = await prisma.registroSaude.findUnique({
          where: { id: input.registroSaudeId },
          select: { animalId: true },
        });

        if (!record || record.animalId !== input.animalId) {
          throw new UploadThingError("Bad Request");
        }
      }

      return {
        userId: session.user.id,
        responsavelId,
        tipoPerfil: session.user.tipoPerfil,
        animalId: input.animalId,
        registroSaudeId: input.registroSaudeId,
        tipoDocumento: input.tipoDocumento,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: input.animalId,
        })),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const document = await persistHealthDocumentUpload(metadata, file);

      return {
        documentId: document.id,
        uploadedBy: metadata.userId,
        animalId: metadata.animalId,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
