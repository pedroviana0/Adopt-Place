import { NextResponse } from "next/server";

import { completeCuidadoPlanejado } from "@/lib/actions/cuidados-planejados";
import { mapCareActionError } from "@/lib/api/health-center-http";
import {
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import { registroSaudeHttpSchema } from "@/lib/schemas/registro-saude";

type RouteContext = { params: Promise<{ id: string }> };

// HEALTH-CENTER-01 (Issue #49, T091): complete planned care. A CONSULTA is
// completed with no body and never creates a health record; the other five
// categories send the actual completion data (ISO dates) which the existing
// action persists as the matching RegistroSaude. Idempotency and the
// CONSULTA-not-history rule are enforced by the action, not re-implemented here.
export async function POST(request: Request, routeContext: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const parsedId = idSchema.safeParse((await routeContext.params).id);
  if (!parsedId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const raw = (await request.json().catch(() => undefined)) as unknown;
  let input: ReturnType<typeof registroSaudeHttpSchema.parse> | undefined;
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    const parsed = registroSaudeHttpSchema.safeParse(raw);
    if (!parsed.success) {
      return responsibleApiError(
        400,
        "VALIDATION_ERROR",
        "Revise os campos informados",
        parsed.error.flatten().fieldErrors,
      );
    }
    input = parsed.data;
  }

  const result = await completeCuidadoPlanejado(parsedId.data, input);
  return result.error
    ? mapCareActionError(result.error)
    : NextResponse.json({ success: true });
}
