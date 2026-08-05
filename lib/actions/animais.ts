"use server";

import { Prisma, StatusAnimal, TipoPerfil } from "@prisma/client";
import type { ZodError } from "zod";

import {
  isCanonicalBreedForSpecies,
  isCanonicalSpeciesName,
} from "@/lib/animal-catalog";
import {
  getResponsibleContext,
  ownsAnimal,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import {
  animalInputSchema,
  animalStatusSchema,
  type AnimalInput,
} from "@/lib/schemas/animal";
import { idSchema } from "@/lib/schemas/common";

type OwnedAnimal = {
  organizacaoId: string | null;
  acolhedorId: string | null;
  status: StatusAnimal;
};

export type AnimalActionResult = {
  success?: boolean;
  id?: string;
  error?: string;
  code?: string;
};

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

async function findAnimalById(id: string): Promise<OwnedAnimal | null> {
  return prisma.animal.findUnique({
    where: { id },
    select: {
      organizacaoId: true,
      acolhedorId: true,
      status: true,
    },
  });
}

async function validateTaxonomy(
  especieId: string,
  racaId: string | null | undefined,
): Promise<Pick<AnimalActionResult, "error" | "code"> | null> {
  const species = await prisma.especie.findUnique({
    where: { id: especieId },
    select: { id: true, nome: true },
  });
  if (!species || !isCanonicalSpeciesName(species.nome)) {
    return {
      error: "A especie informada nao esta disponivel",
      code: "INVALID_SPECIES",
    };
  }

  if (!racaId) {
    return null;
  }

  const breed = await prisma.raca.findUnique({
    where: { id: racaId },
    select: { especieId: true, nome: true },
  });

  return breed?.especieId === especieId &&
    isCanonicalBreedForSpecies(species.nome, breed.nome)
    ? null
    : {
        error: "A raca nao pertence a especie informada",
        code: "INVALID_BREED",
      };
}

export async function createAnimal(
  data: AnimalInput,
): Promise<AnimalActionResult> {
  const contextResult = await getResponsibleContext();

  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const parsed = animalInputSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error), code: "INVALID_INPUT" };
  }

  const taxonomyError = await validateTaxonomy(
    parsed.data.especieId,
    parsed.data.racaId,
  );
  if (taxonomyError) {
    return taxonomyError;
  }

  const { context } = contextResult;
  const owner =
    context.tipoPerfil === TipoPerfil.ORGANIZACAO
      ? { organizacaoId: context.responsavelId, acolhedorId: null }
      : { organizacaoId: null, acolhedorId: context.responsavelId };

  const animal = await prisma.animal.create({
    data: {
      ...parsed.data,
      ...owner,
    },
    select: { id: true },
  });

  return { id: animal.id };
}

export async function updateAnimal(
  id: string,
  data: AnimalInput,
): Promise<AnimalActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = animalInputSchema.safeParse(data);

  if (!parsedId.success || !parsed.success) {
    return {
      error: !parsed.success
        ? firstValidationError(parsed.error)
        : "Identificador invalido.",
      code: "INVALID_INPUT",
    };
  }

  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const animal = await findAnimalById(parsedId.data);
  if (!animal) {
    return { error: "Animal nao encontrado", code: "NOT_FOUND" };
  }
  if (!ownsAnimal(contextResult.context, animal)) {
    return { error: "Acesso negado", code: "FORBIDDEN" };
  }

  const taxonomyError = await validateTaxonomy(
    parsed.data.especieId,
    parsed.data.racaId,
  );
  if (taxonomyError) {
    return taxonomyError;
  }

  await prisma.animal.update({
    where: { id: parsedId.data },
    data: parsed.data,
  });

  return { success: true };
}

export async function updateAnimalStatus(
  id: string,
  status: StatusAnimal,
): Promise<AnimalActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsedStatus = animalStatusSchema.safeParse(status);

  if (!parsedId.success || !parsedStatus.success) {
    return { error: "Dados invalidos.", code: "INVALID_INPUT" };
  }

  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const animal = await findAnimalById(parsedId.data);
  if (!animal) {
    return { error: "Animal nao encontrado", code: "NOT_FOUND" };
  }
  if (!ownsAnimal(contextResult.context, animal)) {
    return { error: "Acesso negado", code: "FORBIDDEN" };
  }

  await prisma.animal.update({
    where: { id: parsedId.data },
    data: { status: parsedStatus.data },
  });

  return { success: true };
}

export async function deleteAnimal(id: string): Promise<AnimalActionResult> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: firstValidationError(parsedId.error), code: "INVALID_INPUT" };
  }

  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return {
      error: contextResult.error.message,
      code: contextResult.error.code,
    };
  }

  const animal = await findAnimalById(parsedId.data);
  if (!animal) {
    return { error: "Animal nao encontrado", code: "NOT_FOUND" };
  }
  if (!ownsAnimal(contextResult.context, animal)) {
    return { error: "Acesso negado", code: "FORBIDDEN" };
  }

  try {
    await prisma.animal.delete({ where: { id: parsedId.data } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error: "Animal possui dependencias e nao pode ser excluido",
        code: "HAS_DEPENDENCIES",
      };
    }
    throw error;
  }

  return { success: true };
}
