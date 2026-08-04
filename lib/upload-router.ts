import { TipoPerfil } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createUploadthing, type FileRouter, UTFiles } from "uploadthing/next";
import { TipoDocumentoSaude } from "@prisma/client";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { persistAnimalPhotoUpload } from "@/lib/actions/fotos";
import {
  getResponsibleContext,
  ownsAnimal,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import {
  MAX_HEALTH_DOCUMENT_BYTES,
  documentoSaudeUploadSchema,
  healthDocumentMimeSchema,
} from "@/lib/schemas/documento-saude";

const f = createUploadthing();

const animalPhotoInputSchema = z
  .object({
    animalId: z.string().cuid(),
  })
  .strict();

export const MAX_ANIMAL_PHOTO_BYTES = 4 * 1024 * 1024;

export function createAnimalPhotoCustomId(animalId: string): string {
  return `${animalId}:${randomUUID()}`;
}

type AnimalPhotoFileDescriptor = {
  name: string;
  size: number;
  type: string;
};

export async function authorizeAnimalPhotoUpload(
  input: unknown,
  files: readonly AnimalPhotoFileDescriptor[],
) {
  const parsed = animalPhotoInputSchema.safeParse(input);
  if (!parsed.success || files.length === 0 || files.length > 10) {
    throw new UploadThingError("Bad Request");
  }
  if (files.some((file) => !file.type.startsWith("image/"))) {
    throw new UploadThingError("Apenas imagens sao permitidas");
  }
  if (files.some((file) => file.size > MAX_ANIMAL_PHOTO_BYTES)) {
    throw new UploadThingError("Cada imagem deve ter no maximo 4 MB");
  }

  const current = await getResponsibleContext();
  if ("error" in current) {
    throw new UploadThingError(
      current.error.status === 401 ? "Unauthorized" : "Forbidden",
    );
  }

  const animal = await prisma.animal.findUnique({
    where: { id: parsed.data.animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });
  if (!ownsAnimal(current.context, animal)) {
    throw new UploadThingError("Forbidden");
  }

  return {
    userId: current.context.userId,
    organizacaoId: current.context.organizacaoId,
    acolhedorId: current.context.acolhedorId,
    animalId: parsed.data.animalId,
  };
}

const healthDocumentInputSchema = z
  .object({
    animalId: z.string().cuid(),
    registroSaudeId: z.string().cuid().optional(),
    tipoDocumento: z.nativeEnum(TipoDocumentoSaude),
  })
  .strict();

type ResponsibleRole = typeof TipoPerfil.ORGANIZACAO | typeof TipoPerfil.ACOLHEDOR;

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

export function createHealthDocumentCustomId(animalId: string): string {
  return `${animalId}:document:${randomUUID()}`;
}

export async function authorizeHealthDocumentUpload(
  input: unknown,
  files: readonly AnimalPhotoFileDescriptor[],
): Promise<HealthUploadMetadata> {
  const parsed = healthDocumentInputSchema.safeParse(input);
  if (!parsed.success || files.length !== 1) {
    throw new UploadThingError("Bad Request");
  }
  if (files[0].size > MAX_HEALTH_DOCUMENT_BYTES) {
    throw new UploadThingError("Arquivo deve ter no maximo 10 MB");
  }
  if (!healthDocumentMimeSchema.safeParse(files[0].type).success) {
    throw new UploadThingError("Envie uma imagem ou arquivo PDF");
  }

  const current = await getResponsibleContext();
  if ("error" in current) {
    throw new UploadThingError(
      current.error.status === 401 ? "Unauthorized" : "Forbidden",
    );
  }

  const animal = await prisma.animal.findUnique({
    where: { id: parsed.data.animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });
  if (!ownsAnimal(current.context, animal)) {
    throw new UploadThingError("Forbidden");
  }

  if (parsed.data.registroSaudeId) {
    const record = await prisma.registroSaude.findUnique({
      where: { id: parsed.data.registroSaudeId },
      select: { animalId: true },
    });
    if (!record || record.animalId !== parsed.data.animalId) {
      throw new UploadThingError("Bad Request");
    }
  }

  return {
    userId: current.context.userId,
    responsavelId: current.context.responsavelId,
    tipoPerfil: current.context.tipoPerfil,
    animalId: parsed.data.animalId,
    registroSaudeId: parsed.data.registroSaudeId,
    tipoDocumento: parsed.data.tipoDocumento,
  };
}

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
      const metadata = await authorizeAnimalPhotoUpload(input, files);

      return {
        ...metadata,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: createAnimalPhotoCustomId(metadata.animalId),
        })),
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const photo = await persistAnimalPhotoUpload(metadata, { url: file.url });
        return {
          photo: {
            id: photo.id,
            animalId: photo.animalId,
            principal: photo.principal,
            ordem: photo.ordem,
          },
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
      const metadata = await authorizeHealthDocumentUpload(input, files);

      return {
        ...metadata,
        [UTFiles]: files.map((file) => ({
          ...file,
          customId: createHealthDocumentCustomId(metadata.animalId),
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
