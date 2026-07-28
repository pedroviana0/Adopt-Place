import { NextResponse } from "next/server";

import { getPublicMetrics } from "@/lib/queries/public-metrics";

// Public metrics contract (SHOWCASE-01 / Issue #26): GET /api/metrics.
// Public, no auth. Returns only aggregate counts, never source rows.
export async function GET() {
  const metrics = await getPublicMetrics();
  return NextResponse.json({
    availableAnimals: metrics.availableAnimals,
    completedAdoptions: metrics.completedAdoptions,
    responsibleParties: metrics.responsibleParties,
  });
}
