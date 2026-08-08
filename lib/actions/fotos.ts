"use server";

import { Prisma, StatusAnimal } from "@prisma/client";
import type { ZodError } from "zod";

import {
  MIN_PHOTOS_TO_PUBLISH,
  PUBLISHED_MIN_PHOTOS,
  publishedMinPhotosMessage,
} from "@/lib/animal-publication";
import {
  getResponsibleContext,
  getResponsibleContextForUser,
  ownsAnimal,
  type ResponsibleContext,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/schemas/common";
import {
  deletePhotoSchema,
  photoOrderSchema,
  type DeletePhotoInput,
  type PhotoOrderInput,
} from "@/lib/schemas/foto-animal";

type ActionResult = {
  success?: boolean;
  error?: string;
  code?: string;
};

type AnimalPhotoUploadMetadata = {
  userId: string;
  organizacaoId: string | null;
  acolhedorId: string | null;
  animalId: string;
};

type UploadedAnimalPhoto = {
  url: string;
};

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

type OwnedAnimalResult =
  | { context: ResponsibleContext; status: StatusAnimal }
  | { error: { code: string; message: string } };

async function getOwnedAnimal(animalId: string): Promise<OwnedAnimalResult> {
  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return { error: contextResult.error } as const;
  }

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { organizacaoId: true, acolhedorId: true, status: true },
  });

  if (!animal) {
    return {
      error: {
        code: "NOT_FOUND",
        message: "Animal nao encontrado",
      },
    } as const;
  }
  if (!ownsAnimal(contextResult.context, animal)) {
    return {
      error: {
        code: "FORBIDDEN",
        message: "Acesso negado",
      },
    } as const;
  }

  return { context: contextResult.context, status: animal.status } as const;
}

export async function updatePhotoOrder(
  animalId: string,
  photos: PhotoOrderInput,
): Promise<ActionResult> {
  const parsedAnimalId = idSchema.safeParse(animalId);
  const parsed = photoOrderSchema.safeParse(photos);

  if (!parsedAnimalId.success || !parsed.success) {
    return {
      error: !parsed.success
        ? firstValidationError(parsed.error)
        : "Identificador invalido.",
      code: "INVALID_INPUT",
    };
  }

  const owned = await getOwnedAnimal(parsedAnimalId.data);
  if ("error" in owned) {
    return { error: owned.error.message, code: owned.error.code };
  }

  const currentPhotos = await prisma.fotoAnimal.findMany({
    where: { animalId: parsedAnimalId.data },
    select: { id: true, animalId: true },
  });
  const receivedIds = parsed.data.map((photo) => photo.id);
  const uniqueIds = new Set(receivedIds);
  const orders = [...parsed.data.map((photo) => photo.ordem)].sort((a, b) => a - b);
  const hasCompleteSet =
    currentPhotos.length === parsed.data.length &&
    uniqueIds.size === parsed.data.length &&
    currentPhotos.every((photo) => uniqueIds.has(photo.id)) &&
    orders.every((order, index) => order === index);

  if (!hasCompleteSet) {
    return {
      error: "Informe todas as fotos do animal uma unica vez",
      code: "INVALID_PHOTO_ORDER",
    };
  }

  await prisma.$transaction(
    parsed.data.map((photo) =>
      prisma.fotoAnimal.update({
        where: { id: photo.id },
        data: { ordem: photo.ordem },
      }),
    ),
  );

  return { success: true };
}

export async function setPrimaryPhoto(
  animalId: string,
  fotoId: string,
): Promise<ActionResult> {
  const parsedAnimalId = idSchema.safeParse(animalId);
  const parsedPhotoId = idSchema.safeParse(fotoId);
  if (!parsedAnimalId.success || !parsedPhotoId.success) {
    return { error: "Dados invalidos.", code: "INVALID_INPUT" };
  }

  const owned = await getOwnedAnimal(parsedAnimalId.data);
  if ("error" in owned) {
    return { error: owned.error.message, code: owned.error.code };
  }

  const photo = await prisma.fotoAnimal.findUnique({
    where: { id: parsedPhotoId.data },
    select: { id: true, animalId: true },
  });
  if (!photo || photo.animalId !== parsedAnimalId.data) {
    return { error: "Foto nao encontrada", code: "NOT_FOUND" };
  }

  await prisma.$transaction([
    prisma.fotoAnimal.updateMany({
      where: { animalId: parsedAnimalId.data },
      data: { principal: false },
    }),
    prisma.fotoAnimal.update({
      where: { id: parsedPhotoId.data },
      data: { principal: true },
    }),
  ]);

  return { success: true };
}

export async function deleteAnimalPhoto(
  animalId: string,
  fotoId: string,
  input: DeletePhotoInput = {},
): Promise<ActionResult> {
  const parsedAnimalId = idSchema.safeParse(animalId);
  const parsedPhotoId = idSchema.safeParse(fotoId);
  const parsedInput = deletePhotoSchema.safeParse(input);
  if (!parsedAnimalId.success || !parsedPhotoId.success || !parsedInput.success) {
    return { error: "Dados invalidos.", code: "INVALID_INPUT" };
  }

  const owned = await getOwnedAnimal(parsedAnimalId.data);
  if ("error" in owned) {
    return { error: owned.error.message, code: owned.error.code };
  }

  const photos = await prisma.fotoAnimal.findMany({
    where: { animalId: parsedAnimalId.data },
    select: { id: true, principal: true },
  });
  const target = photos.find((photo) => photo.id === parsedPhotoId.data);
  if (!target) {
    return { error: "Foto nao encontrada", code: "NOT_FOUND" };
  }

  // Sem isto a regra do anuncio seria contornavel: bastava publicar com duas
  // fotos e apagar uma depois.
  if (
    owned.status === StatusAnimal.DISPONIVEL &&
    photos.length <= MIN_PHOTOS_TO_PUBLISH
  ) {
    return { error: publishedMinPhotosMessage, code: PUBLISHED_MIN_PHOTOS };
  }

  const replacement = parsedInput.data.novaPrincipalId
    ? photos.find(
        (photo) =>
          photo.id === parsedInput.data.novaPrincipalId &&
          photo.id !== target.id,
      )
    : undefined;
  if (parsedInput.data.novaPrincipalId && !replacement) {
    return {
      error: "Nova foto principal invalida",
      code: "INVALID_PRIMARY_REPLACEMENT",
    };
  }
  if (target.principal && photos.length > 1 && !replacement) {
    return {
      error: "Informe a nova foto principal",
      code: "PRIMARY_REPLACEMENT_REQUIRED",
    };
  }
  if (target.principal && photos.length === 1) {
    return {
      error: "O animal precisa de pelo menos uma foto principal",
      code: "LAST_PHOTO_REQUIRED",
    };
  }

  const operations = [];
  if (target.principal && replacement) {
    operations.push(
      prisma.fotoAnimal.updateMany({
        where: { animalId: parsedAnimalId.data },
        data: { principal: false },
      }),
      prisma.fotoAnimal.update({
        where: { id: replacement.id },
        data: { principal: true },
      }),
    );
  }
  operations.push(prisma.fotoAnimal.delete({ where: { id: target.id } }));
  await prisma.$transaction(operations);

  return { success: true };
}

export async function persistAnimalPhotoUpload(
  metadata: AnimalPhotoUploadMetadata,
  file: UploadedAnimalPhoto,
) {
  const parsed = idSchema.safeParse(metadata.animalId);
  const parsedUrl = URL.canParse(file.url) ? new URL(file.url) : null;
  if (
    !parsed.success ||
    !parsedUrl ||
    !["http:", "https:"].includes(parsedUrl.protocol)
  ) {
    throw new Error("Bad Request");
  }

  const contextResult = await getResponsibleContextForUser(metadata.userId);
  if ("error" in contextResult) {
    throw new Error(contextResult.error.message);
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const animal = await tx.animal.findUnique({
            where: { id: parsed.data },
            select: { organizacaoId: true, acolhedorId: true },
          });
          if (!ownsAnimal(contextResult.context, animal)) {
            throw new Error("Acesso negado");
          }

          const count = await tx.fotoAnimal.count({
            where: { animalId: parsed.data },
          });
          if (count >= 10) {
            throw new Error("Maximo de 10 fotos permitidas");
          }
          const primary = await tx.fotoAnimal.findFirst({
            where: { animalId: parsed.data, principal: true },
            select: { id: true },
          });

          return tx.fotoAnimal.create({
            data: {
              animalId: parsed.data,
              urlFoto: file.url,
              principal: !primary,
              ordem: count,
            },
            select: {
              id: true,
              animalId: true,
              urlFoto: true,
              principal: true,
              ordem: true,
              criadoEm: true,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("Upload failed");
}
