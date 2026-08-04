import { NextResponse } from "next/server";

import { setUserActive } from "@/lib/actions/admin-users";
import { adminApiError, requireActiveAdmin } from "@/lib/api/admin-http";
import { readJson } from "@/lib/api/responsible-http";
import { idSchema } from "@/lib/schemas/common";
import { z } from "zod";

const bodySchema = z.object({ ativo: z.boolean() }).strict();

type RouteContext = { params: Promise<{ id: string }> };

// ADMIN-01 (Issue #60, T109): admin-only active-account toggle. Thin HTTP
// exposure of the existing `setUserActive` action, which also re-checks ADMIN.
export async function PATCH(request: Request, context: RouteContext) {
  const current = await requireActiveAdmin();
  if ("response" in current) return current.response;

  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) {
    return adminApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const json = await readJson(request);
  if ("response" in json) return json.response;
  const parsedBody = bodySchema.safeParse(json.body);
  if (!parsedBody.success) {
    return adminApiError(400, "VALIDATION_ERROR", "Informe o novo estado da conta");
  }

  const result = await setUserActive({
    userId: parsedId.data,
    ativo: parsedBody.data.ativo,
  });
  if (result.error) {
    const status = result.error === "Acesso negado" ? 403 : result.error === "Nao autenticado" ? 401 : 400;
    return adminApiError(status, "OPERATION_FAILED", result.error);
  }
  return NextResponse.json({ success: true });
}
