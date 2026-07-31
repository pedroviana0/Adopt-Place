import { NextResponse } from "next/server";

import {
  completeAdoption,
  decideAdoptionRequest,
} from "@/lib/actions/solicitacoes";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getOwnerRequestDetail } from "@/lib/queries/owner-request-detail";
import { idSchema } from "@/lib/schemas/common";
import { requestDecisionSchema } from "@/lib/schemas/solicitacao-decisao";

type RouteContext = { params: Promise<{ id: string }> };

async function validatedId(context: RouteContext) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
  const request = await getOwnerRequestDetail(
    id,
    current.context.responsavelId,
    current.context.tipoPerfil,
  );
  return request
    ? NextResponse.json({ request })
    : responsibleApiError(404, "NOT_FOUND", "Solicitacao nao encontrada");
}

export async function PATCH(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
  const json = await readJson(request);
  if ("response" in json) return json.response;
  const input = requestDecisionSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await decideAdoptionRequest(id, input.data, current.context);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}

export async function POST(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
  const result = await completeAdoption(id, current.context);
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
