import { NextResponse } from "next/server";

import { requireActiveResponsible, responsibleApiError } from "@/lib/api/responsible-http";
import { getHealthAgenda } from "@/lib/queries/health-dashboard";
import { agendaFilterSchema } from "@/lib/schemas/cuidado-planejado";

// HEALTH-CENTER-01 (Issue #49, T091): chronological health agenda for the
// authenticated responsible party, with owner-scoped filters. Thin HTTP
// exposure of the existing query; no new behavior.
export async function GET(request: Request) {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const filters = agendaFilterSchema.safeParse(
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

  const items = await getHealthAgenda(filters.data);
  return NextResponse.json({ items });
}
