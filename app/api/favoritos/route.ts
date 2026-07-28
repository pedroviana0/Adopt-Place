import { NextResponse } from "next/server";

import { requireActiveAdopter } from "@/lib/api/adopter-context";
import {
  getAdopterFavorites,
  toFavoriteDTO,
} from "@/lib/queries/favorites";

export async function GET() {
  const current = await requireActiveAdopter();
  if ("response" in current) {
    return current.response;
  }

  const favorites = await getAdopterFavorites(current.adotanteId);

  return NextResponse.json({ favorites: favorites.map(toFavoriteDTO) });
}
