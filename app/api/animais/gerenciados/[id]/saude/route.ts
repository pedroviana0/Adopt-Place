import { NextResponse } from "next/server";

import { createRegistroSaude } from "@/lib/actions/registro-saude";
import {
  actionErrorResponse,
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import {
  getOwnedHealthRecord,
  getOwnedHealthRecords,
  toHealthRecordDTO,
} from "@/lib/queries/health-records";
import { idSchema } from "@/lib/schemas/common";
import { registroSaudeHttpSchema } from "@/lib/schemas/registro-saude";

type RouteContext = { params: Promise<{ id: string }> };

async function validatedId(context: RouteContext) {
  const parsed = idSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const animalId = await validatedId(routeContext);
  if (!animalId) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
  const records = await getOwnedHealthRecords(animalId, current.context);
  return records
    ? NextResponse.json({ records: records.map(toHealthRecordDTO) })
    : responsibleApiError(404, "NOT_FOUND", "Animal nao encontrado");
}

export async function POST(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const animalId = await validatedId(routeContext);
  if (!animalId) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }
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

  const result = await createRegistroSaude(
    animalId,
    input.data,
    current.context,
  );
  if (result.error || !result.id) return actionErrorResponse(result);

  const record = await getOwnedHealthRecord(
    result.id,
    animalId,
    current.context,
  );
  return record
    ? NextResponse.json({ record: toHealthRecordDTO(record) }, { status: 201 })
    : responsibleApiError(500, "PERSISTENCE_ERROR", "Registro criado, mas nao relido");
}
