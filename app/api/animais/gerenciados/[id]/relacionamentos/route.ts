import { NextResponse } from "next/server";

import { linkAnimals } from "@/lib/actions/animal-relacionado";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getOwnedAnimalRelationships } from "@/lib/queries/animal-relationships";
import { relatedAnimalRequestSchema } from "@/lib/schemas/animal-relacionado";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }
  const animalId = idSchema.safeParse((await context.params).id);
  if (!animalId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const relationships = await getOwnedAnimalRelationships(
    animalId.data,
    current.context,
  );
  if (!relationships) {
    return responsibleApiError(404, "NOT_FOUND", "Animal nao encontrado");
  }
  return NextResponse.json({ relationships });
}

export async function POST(request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const animalId = idSchema.safeParse((await context.params).id);
  if (!animalId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
  const json = await readJson(request);
  if ("response" in json) {
    return json.response;
  }
  const input = relatedAnimalRequestSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Dados invalidos");
  }

  const result = await linkAnimals({
    animalId: animalId.data,
    animalRelacionadoId: input.data.animalRelacionadoId,
  });
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true }, { status: 201 });
}
