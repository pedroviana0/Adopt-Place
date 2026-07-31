import { NextResponse } from "next/server";

import {
  deleteRegistroSaude,
  updateRegistroSaude,
} from "@/lib/actions/registro-saude";
import type { ResponsibleContext } from "@/lib/api/responsible-context";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import {
  getOwnedHealthRecord,
  toHealthRecordDTO,
} from "@/lib/queries/health-records";
import { idSchema } from "@/lib/schemas/common";
import { registroSaudeHttpSchema } from "@/lib/schemas/registro-saude";

type RouteContext = {
  params: Promise<{ id: string; registroId: string }>;
};

async function validatedIds(context: RouteContext) {
  const params = await context.params;
  const animalId = idSchema.safeParse(params.id);
  const recordId = idSchema.safeParse(params.registroId);
  return animalId.success && recordId.success
    ? { animalId: animalId.data, recordId: recordId.data }
    : null;
}

async function requireOwnedRecord(
  routeContext: RouteContext,
  context: ResponsibleContext,
): Promise<
  | {
      ids: { animalId: string; recordId: string };
      record: NonNullable<Awaited<ReturnType<typeof getOwnedHealthRecord>>>;
    }
  | { response: NextResponse }
> {
  const ids = await validatedIds(routeContext);
  if (!ids) return { response: responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido") };
  const record = await getOwnedHealthRecord(ids.recordId, ids.animalId, context);
  return record
    ? { ids, record }
    : { response: responsibleApiError(404, "NOT_FOUND", "Registro de saude nao encontrado") };
}

export async function PATCH(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const owned = await requireOwnedRecord(routeContext, current.context);
  if ("response" in owned) return owned.response;
  const json = await readJson(request);
  if ("response" in json) return json.response;
  const input = registroSaudeHttpSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await updateRegistroSaude(
    owned.ids.recordId,
    input.data,
    current.context,
  );
  if (result.error) return actionErrorResponse(result);
  const updated = await getOwnedHealthRecord(
    owned.ids.recordId,
    owned.ids.animalId,
    current.context,
  );
  return updated
    ? NextResponse.json({ record: toHealthRecordDTO(updated) })
    : responsibleApiError(404, "NOT_FOUND", "Registro de saude nao encontrado");
}

export async function DELETE(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const owned = await requireOwnedRecord(routeContext, current.context);
  if ("response" in owned) return owned.response;
  const result = await deleteRegistroSaude(
    owned.ids.recordId,
    current.context,
  );
  return result.error
    ? actionErrorResponse(result)
    : NextResponse.json({ success: true });
}
