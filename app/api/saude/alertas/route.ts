import { NextResponse } from "next/server";

import { requireActiveResponsible } from "@/lib/api/responsible-http";
import {
  getUpcomingAlerts,
  toUpcomingAlertDTO,
} from "@/lib/queries/procedure-alerts";

export async function GET() {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const alerts = await getUpcomingAlerts(
    current.context.responsavelId,
    current.context.tipoPerfil,
  );
  return NextResponse.json({ alerts: alerts.map(toUpcomingAlertDTO) });
}
