import { NextResponse } from "next/server";

import { deleteDocumentoSaude } from "@/lib/actions/documentos-saude";
import {
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getHealthDocumentDetail } from "@/lib/queries/documentos-saude";
import { idSchema } from "@/lib/schemas/common";

type RouteContext = { params: Promise<{ id: string }> };

async function validatedId(context: RouteContext) {
  return idSchema.safeParse((await context.params).id);
}

export async function GET(_request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const parsedId = await validatedId(context);
  if (!parsedId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const document = await getHealthDocumentDetail(parsedId.data, current.context);
  if (!document) {
    return responsibleApiError(404, "NOT_FOUND", "Documento nao encontrado");
  }
  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const parsedId = await validatedId(context);
  if (!parsedId.success) {
    return responsibleApiError(400, "VALIDATION_ERROR", "Identificador invalido");
  }

  const result = await deleteDocumentoSaude(parsedId.data);
  if (result.error === "Documento nao encontrado") {
    return responsibleApiError(404, "NOT_FOUND", result.error);
  }
  if (result.error === "Acesso negado") {
    return responsibleApiError(403, "FORBIDDEN", result.error);
  }
  if (result.error) {
    return responsibleApiError(400, "OPERATION_FAILED", result.error);
  }
  return NextResponse.json({ success: true });
}
