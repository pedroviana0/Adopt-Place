import { NextResponse } from "next/server";

import { requireActiveResponsible } from "@/lib/api/responsible-http";
import { getOperationalDashboard } from "@/lib/queries/operational-dashboard";

export async function GET() {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const dashboard = await getOperationalDashboard(new Date(), current.context);
  return NextResponse.json({ dashboard });
}
