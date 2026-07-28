import { NextResponse } from "next/server";

import { unlinkAnimals } from "@/lib/actions/animal-relacionado";
import {
  actionErrorResponse,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = {
  params: Promise<{ id: string; relatedId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) {
    return current.response;
  }

  const params = await context.params;
  const animalId = idSchema.safeParse(params.id);
  const relatedId = idSchema.safeParse(params.relatedId);
  if (!animalId.success || !relatedId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await unlinkAnimals(animalId.data, relatedId.data);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
