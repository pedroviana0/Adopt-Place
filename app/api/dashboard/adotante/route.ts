import { NextResponse } from "next/server";

import {
  apiError,
  requireActiveAdopter,
} from "@/lib/api/adopter-context";
import { getAdopterDashboard } from "@/lib/queries/adotante-dashboard";

export async function GET() {
  const current = await requireActiveAdopter();
  if ("response" in current) {
    return current.response;
  }

  const dashboard = await getAdopterDashboard(current.adotanteId);
  if (!dashboard) {
    return apiError(404, "PROFILE_NOT_FOUND", "Perfil nao encontrado.");
  }

  return NextResponse.json({ dashboard });
}
