import { NextResponse } from "next/server";

import {
  deleteFosterHome,
  updateFosterHome,
} from "@/lib/actions/lares-temporarios";
import {
  actionErrorResponse,
  readJson,
  requireActiveOrganization,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getFosterHomeDetail } from "@/lib/queries/lares-temporarios";
import { idSchema } from "@/lib/schemas/common";
import { larTemporarioUpdateSchema } from "@/lib/schemas/lar-temporario";

type RouteContext = { params: Promise<{ id: string }> };

async function validatedId(context: RouteContext) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const larTemporario = await getFosterHomeDetail(id, current.context.responsavelId);
  return larTemporario
    ? NextResponse.json({ larTemporario })
    : responsibleApiError(404, "NOT_FOUND", "Lar temporario nao encontrado");
}

export async function PATCH(request: Request, routeContext: RouteContext) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const json = await readJson(request);
  if ("response" in json) return json.response;

  const input = larTemporarioUpdateSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await updateFosterHome(id, input.data, current.context);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await deleteFosterHome(id, current.context);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
