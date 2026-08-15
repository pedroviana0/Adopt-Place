import { TipoPerfil } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createUploadthing, type FileRouter, UTFiles } from "uploadthing/next";
import { TipoDocumentoSaude } from "@prisma/client";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

import { persistAnimalPhotoUpload } from "@/lib/actions/fotos";
import { getServerSession } from "@/lib/auth";
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

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"]);
const extensionOf = (name: string) => name.toLowerCase().split(".").pop() ?? "";
const hasImageExtension = (name: string) => IMAGE_EXTENSIONS.has(extensionOf(name));

const profileImageInputSchema = z.object({}).strict();
export const MAX_PROFILE_IMAGE_BYTES = 4 * 1024 * 1024;

type ProfileImageMetadata = {
  userId: string;
  responsavelId: string;
  tipoPerfil: ResponsibleRole;
};

export async function authorizeProfileImageUpload(
  input: unknown,
  files: readonly AnimalPhotoFileDescriptor[],
): Promise<ProfileImageMetadata> {
  if (!profileImageInputSchema.safeParse(input).success || files.length !== 1) {
    throw new UploadThingError("Bad Request");
  }
  if (!files[0].type.startsWith("image/") || !hasImageExtension(files[0].name)) {
    throw new UploadThingError("Apenas imagens sao permitidas");
  }
  if (files[0].size > MAX_PROFILE_IMAGE_BYTES) {
    throw new UploadThingError("A imagem deve ter no maximo 4 MB");
  }

  const session = await getServerSession();
  if (!session?.user?.id) throw new UploadThingError("Unauthorized");
  if (!session.user.ativo) throw new UploadThingError("Forbidden");
  if (
    session.user.tipoPerfil !== TipoPerfil.ORGANIZACAO &&
    session.user.tipoPerfil !== TipoPerfil.ACOLHEDOR
  ) {
    throw new UploadThingError("Forbidden");
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      ativo: true,
      tipoPerfil: true,
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });
  const responsavelId =
    user?.tipoPerfil === TipoPerfil.ORGANIZACAO
      ? user.organizacao?.id
      : user?.tipoPerfil === TipoPerfil.ACOLHEDOR
        ? user.acolhedor?.id
        : null;
  if (!user?.ativo || !responsavelId || user.tipoPerfil !== session.user.tipoPerfil) {
    throw new UploadThingError("Forbidden");
  }

  return { userId: user.id, tipoPerfil: user.tipoPerfil, responsavelId };
}

export async function persistProfileImageUpload(
  metadata: ProfileImageMetadata,
  file: { ufsUrl: string },
) {
  const user = await prisma.usuario.findUnique({
    where: { id: metadata.userId },
    select: {
      id: true,
      ativo: true,
      tipoPerfil: true,
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });
  const currentProfileId =
    user?.tipoPerfil === TipoPerfil.ORGANIZACAO
      ? user.organizacao?.id
      : user?.tipoPerfil === TipoPerfil.ACOLHEDOR
        ? user.acolhedor?.id
        : null;
  if (
    !user?.ativo ||
    user.tipoPerfil !== metadata.tipoPerfil ||
    currentProfileId !== metadata.responsavelId
  ) {
    throw new UploadThingError("Forbidden");
  }

  return metadata.tipoPerfil === TipoPerfil.ORGANIZACAO
    ? prisma.organizacao.update({
        where: { id: metadata.responsavelId },
        data: { fotoUrl: file.ufsUrl },
        select: { fotoUrl: true },
      })
    : prisma.acolhedorIndependente.update({
        where: { id: metadata.responsavelId },
        data: { fotoUrl: file.ufsUrl },
        select: { fotoUrl: true },
      });
}

export async function authorizeAnimalPhotoUpload(
  input: unknown,
  files: readonly AnimalPhotoFileDescriptor[],
) {
  const parsed = animalPhotoInputSchema.safeParse(input);
  if (!parsed.success || files.length === 0 || files.length > 10) {
    throw new UploadThingError("Bad Request");
  }
  if (files.some((file) => !file.type.startsWith("image/") || !hasImageExtension(file.name))) {
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
  const extension = extensionOf(files[0].name);
  const extensionMatchesMime = files[0].type === "application/pdf"
    ? extension === "pdf"
    : hasImageExtension(files[0].name);
  if (!extensionMatchesMime) {
    throw new UploadThingError("A extensão do arquivo não corresponde ao tipo enviado");
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
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(profileImageInputSchema)
    .middleware(async ({ files, input }) => authorizeProfileImageUpload(input, files))
    .onUploadComplete(async ({ metadata, file }) => ({
      profileImage: await persistProfileImageUpload(metadata, { ufsUrl: file.ufsUrl }),
    })),
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
    // Uploadthing accepts power-of-two limits only. Middleware rejects files
    // above the product limit of 10 MB before authorization/persistence.
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
