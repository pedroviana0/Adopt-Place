import { NextResponse } from "next/server";

import {
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import { getHealthDocuments } from "@/lib/queries/documentos-saude";
import { documentoSaudeFilterSchema } from "@/lib/schemas/documento-saude";

export async function GET(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const parsed = documentoSaudeFilterSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Filtros invalidos",
      parsed.error.flatten().fieldErrors,
    );
  }

  const documents = await getHealthDocuments(parsed.data, current.context);
  return NextResponse.json({ documents });
}
