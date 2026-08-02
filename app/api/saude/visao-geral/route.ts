import { NextResponse } from "next/server";

import { requireActiveResponsible } from "@/lib/api/responsible-http";
import { getHealthOverview } from "@/lib/queries/health-dashboard";

// HEALTH-CENTER-01 (Issue #49, T091): health overview for the authenticated
// responsible party. Thin HTTP exposure of the existing owner-scoped query;
// no new behavior. Dates are serialized as ISO strings by NextResponse.
export async function GET() {
  const current = await requireActiveResponsible();
  if ("response" in current) return current.response;

  const overview = await getHealthOverview();
  return NextResponse.json({ overview });
}
