import { NextResponse } from "next/server";

import { createAnimal } from "@/lib/actions/animais";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getOwnedAnimals, toOwnedAnimalDTO } from "@/lib/queries/owned-animals";
import { animalInputSchema } from "@/lib/schemas/animal";
import { ownedAnimalFilterSchema } from "@/lib/schemas/dashboard-filters";

export async function GET(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = ownedAnimalFilterSchema.safeParse(params);
  if (!filters.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Filtros invalidos",
      filters.error.flatten().fieldErrors,
    );
  }

  const animals = await getOwnedAnimals(
    current.context.responsavelId,
    current.context.tipoPerfil,
    filters.data,
  );
  return NextResponse.json({ animals: animals.map(toOwnedAnimalDTO) });
}

export async function POST(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const json = await readJson(request);
  if ("response" in json) {
    return json.response;
  }

  const input = animalInputSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await createAnimal(input.data);
  if (result.error || !result.id) {
    return actionErrorResponse(result);
  }

  return NextResponse.json({ animal: { id: result.id } }, { status: 201 });
}
