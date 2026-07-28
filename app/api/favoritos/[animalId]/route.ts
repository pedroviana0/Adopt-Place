import { StatusAnimal } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  apiError,
  requireActiveAdopter,
} from "@/lib/api/adopter-context";
import { prisma } from "@/lib/prisma";
import { toggleFavoriteSchema } from "@/lib/schemas/favorito";

type RouteContext = {
  params: Promise<{ animalId: string }>;
};

async function validatedContext(context: RouteContext) {
  const current = await requireActiveAdopter();
  if ("response" in current) {
    return current;
  }

  const parsed = toggleFavoriteSchema.safeParse(await context.params);
  if (!parsed.success) {
    return {
      response: apiError(
        400,
        "VALIDATION_ERROR",
        "Identificador do animal invalido.",
        parsed.error.flatten().fieldErrors,
      ),
    };
  }

  return { ...current, animalId: parsed.data.animalId };
}

export async function PUT(_request: Request, context: RouteContext) {
  const current = await validatedContext(context);
  if ("response" in current) {
    return current.response;
  }

  const animal = await prisma.animal.findUnique({
    where: { id: current.animalId },
    select: { status: true },
  });

  if (animal?.status !== StatusAnimal.DISPONIVEL) {
    return apiError(
      404,
      "ANIMAL_NOT_AVAILABLE",
      "Animal nao disponivel para favoritos.",
    );
  }

  await prisma.favorito.upsert({
    where: {
      adotanteId_animalId: {
        adotanteId: current.adotanteId,
        animalId: current.animalId,
      },
    },
    create: {
      adotanteId: current.adotanteId,
      animalId: current.animalId,
    },
    update: {},
  });

  return NextResponse.json({
    favorite: { animalId: current.animalId, favorited: true },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const current = await validatedContext(context);
  if ("response" in current) {
    return current.response;
  }

  await prisma.favorito.deleteMany({
    where: {
      adotanteId: current.adotanteId,
      animalId: current.animalId,
    },
  });

  return NextResponse.json({
    favorite: { animalId: current.animalId, favorited: false },
  });
}
