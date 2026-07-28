import { NextResponse } from "next/server";

import { deleteAnimal, updateAnimal } from "@/lib/actions/animais";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import {
  getOwnedAnimalById,
  toOwnedAnimalDetailDTO,
} from "@/lib/queries/owned-animals";
import { animalInputSchema } from "@/lib/schemas/animal";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function validatedId(context: RouteContext) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const animal = await getOwnedAnimalById(id, current.context);
  if (!animal) {
    return responsibleApiError(404, "NOT_FOUND", "Animal nao encontrado");
  }

  return NextResponse.json({ animal: toOwnedAnimalDetailDTO(animal) });
}

export async function PATCH(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
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

  const result = await updateAnimal(id, input.data);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await deleteAnimal(id);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
