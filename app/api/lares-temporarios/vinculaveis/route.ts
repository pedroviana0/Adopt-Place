import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/api/responsible-http";
import { getLinkableAnimals } from "@/lib/queries/lares-temporarios";

export async function GET() {
  const current = await requireActiveOrganization();
  if ("response" in current) return current.response;

  const animais = await getLinkableAnimals(current.context.responsavelId);
  return NextResponse.json({ animais });
}
