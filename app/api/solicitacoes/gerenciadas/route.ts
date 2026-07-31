import { NextResponse } from "next/server";

import {
  requireActiveResponsible,
  responsibleApiError,
} from "@/lib/api/responsible-http";
import {
  getOwnerRequests,
  toOwnerRequestDTO,
} from "@/lib/queries/owner-requests";
import { ownerRequestFilterSchema } from "@/lib/schemas/dashboard-filters";

export async function GET(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const filters = ownerRequestFilterSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!filters.success) {
    return responsibleApiError(
      400,
      "VALIDATION_ERROR",
      "Filtros invalidos",
      filters.error.flatten().fieldErrors,
    );
  }

  const requests = await getOwnerRequests(
    current.context.responsavelId,
    current.context.tipoPerfil,
    filters.data,
  );
  return NextResponse.json({ requests: requests.map(toOwnerRequestDTO) });
}
