import { NextResponse } from "next/server";

import {
  cancelCuidadoPlanejado,
  rescheduleCuidadoPlanejado,
} from "@/lib/actions/cuidados-planejados";
import { mapCareActionError } from "@/lib/api/health-center-http";
import {
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import {
  cancelarCuidadoSchema,
  reagendarCuidadoSchema,
} from "@/lib/schemas/cuidado-planejado";

type RouteContext = { params: Promise<{ id: string }> };

async function validatedId(context: RouteContext) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

// HEALTH-CENTER-01 (Issue #49, T091): reschedule the single planned occurrence.
export async function PATCH(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");

  const json = await readJson(request);
  if ("response" in json) return json.response;
  const input = reagendarCuidadoSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await rescheduleCuidadoPlanejado(id, input.data);
  return result.error
    ? mapCareActionError(result.error)
    : NextResponse.json({ success: true });
}

// HEALTH-CENTER-01 (Issue #49, T091): cancel/discard planned care. Confirmation
// is required (FR-013); the completed health history is preserved by the action.
export async function DELETE(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const id = await validatedId(routeContext);
  if (!id) return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");

  const json = await readJson(request);
  if ("response" in json) return json.response;
  const input = cancelarCuidadoSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Confirme o cancelamento",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await cancelCuidadoPlanejado(id, input.data);
  return result.error
    ? mapCareActionError(result.error)
    : NextResponse.json({ success: true });
}
