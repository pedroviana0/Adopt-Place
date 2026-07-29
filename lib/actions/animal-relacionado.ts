"use server";

import type { ZodError } from "zod";

import {
  getResponsibleContext,
  ownsAnimal,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import {
  animalRelacionadoSchema,
  type AnimalRelacionadoInput,
} from "@/lib/schemas/animal-relacionado";

type OwnedAnimal = {
  id: string;
  organizacaoId: string | null;
  acolhedorId: string | null;
};

type ActionResult = {
  success?: boolean;
  error?: string;
  code?: string;
};

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

async function findAnimal(id: string): Promise<OwnedAnimal | null> {
  return prisma.animal.findUnique({
    where: { id },
    select: {
      id: true,
      organizacaoId: true,
      acolhedorId: true,
    },
  });
}

export async function linkAnimals(
  data: AnimalRelacionadoInput,
): Promise<ActionResult> {
  const parsed = animalRelacionadoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: firstValidationError(parsed.error), code: "INVALID_INPUT" };
  }

  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const { animalId, animalRelacionadoId } = parsed.data;
  const [animal, relatedAnimal] = await Promise.all([
    findAnimal(animalId),
    findAnimal(animalRelacionadoId),
  ]);

  if (
    !ownsAnimal(contextResult.context, animal) ||
    !ownsAnimal(contextResult.context, relatedAnimal)
  ) {
    return { error: "Acesso negado", code: "FORBIDDEN" };
  }

  await prisma.$transaction(async (tx) => {
    const existingRelationship = await tx.animalRelacionado.findFirst({
      where: {
        OR: [
          { animalId, animalRelacionadoId },
          { animalId: animalRelacionadoId, animalRelacionadoId: animalId },
        ],
      },
      select: {
        animalId: true,
        animalRelacionadoId: true,
      },
    });

    if (!existingRelationship) {
      await tx.animalRelacionado.createMany({
        data: [
          { animalId, animalRelacionadoId },
          { animalId: animalRelacionadoId, animalRelacionadoId: animalId },
        ],
        skipDuplicates: true,
      });
    }
  });

  return { success: true };
}

export async function unlinkAnimals(
  animalId: string,
  animalRelacionadoId: string,
): Promise<ActionResult> {
  const parsed = animalRelacionadoSchema.safeParse({
    animalId,
    animalRelacionadoId,
  });
  if (!parsed.success) {
    return { error: firstValidationError(parsed.error), code: "INVALID_INPUT" };
  }

  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const [animal, relatedAnimal] = await Promise.all([
    findAnimal(parsed.data.animalId),
    findAnimal(parsed.data.animalRelacionadoId),
  ]);
  if (
    !ownsAnimal(contextResult.context, animal) ||
    !ownsAnimal(contextResult.context, relatedAnimal)
  ) {
    return { error: "Acesso negado", code: "FORBIDDEN" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.animalRelacionado.deleteMany({
      where: {
        OR: [
          {
            animalId: parsed.data.animalId,
            animalRelacionadoId: parsed.data.animalRelacionadoId,
          },
          {
            animalId: parsed.data.animalRelacionadoId,
            animalRelacionadoId: parsed.data.animalId,
          },
        ],
      },
    });
  });

  return { success: true };
}
