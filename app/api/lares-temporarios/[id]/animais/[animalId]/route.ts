import { NextResponse } from "next/server";

import { unlinkAnimalFromFosterHome } from "@/lib/actions/lares-temporarios";
import {
  actionErrorResponse,
  requireActiveOrganization,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = { params: Promise<{ id: string; animalId: string }> };

export async function DELETE(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const params = await routeContext.params;
  const id = idSchema.safeParse(params.id);
  const animalId = idSchema.safeParse(params.animalId);
  if (!id.success || !animalId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await unlinkAnimalFromFosterHome(
    id.data,
    animalId.data,
    current.context,
  );
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
