import { NextResponse } from "next/server";

import { linkAnimalToFosterHome } from "@/lib/actions/lares-temporarios";
import {
  actionErrorResponse,
  readJson,
  requireActiveOrganization,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import { vincularAnimalSchema } from "@/lib/schemas/lar-temporario";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, routeContext: RouteContext) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const id = idSchema.safeParse((await routeContext.params).id);
  if (!id.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const json = await readJson(request);
  if ("response" in json) return json.response;

  const input = vincularAnimalSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await linkAnimalToFosterHome(
    id.data,
    input.data.animalId,
    current.context,
  );
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
