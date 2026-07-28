import { NextResponse } from "next/server";

import { getShowcaseFilterOptions } from "@/lib/queries/animal-showcase";

// Public catalog contract (SHOWCASE-01 / Issue #26): GET /api/catalogos.
// Public, no auth. Species/breeds and the cities that currently have available
// animals, for the showcase filters. No private address or contact data.
export async function GET() {
  const { especies, cities } = await getShowcaseFilterOptions();
  return NextResponse.json({
    especies: especies.map((especie) => ({
      id: especie.id,
      nome: especie.nome,
      racas: especie.racas.map((raca) => ({
        id: raca.id,
        nome: raca.nome,
        especieId: raca.especieId,
      })),
    })),
    cidades: cities,
  });
}
