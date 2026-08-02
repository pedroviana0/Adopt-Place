import { NextResponse } from "next/server";

import {
  readJson,
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { mapCareActionError } from "@/lib/api/health-center-http";
import { createConsultaPlanejada } from "@/lib/actions/cuidados-planejados";
import { consultaPlanejadaSchema } from "@/lib/schemas/cuidado-planejado";

// HEALTH-CENTER-01 (Issue #49, T091): register a manual future CONSULTA event.
// A CONSULTA is agenda-only and never becomes health history (enforced by the
// existing action). Thin HTTP exposure; no new behavior.
export async function POST(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const json = await readJson(request);
  if ("response" in json) return json.response;
  const input = consultaPlanejadaSchema.safeParse(json.body);
  if (!input.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Revise os campos informados",
      input.error.flatten().fieldErrors,
    );
  }

  const result = await createConsultaPlanejada(input.data);
  return result.error
    ? mapCareActionError(result.error)
    : NextResponse.json({ success: true }, { status: 201 });
}
