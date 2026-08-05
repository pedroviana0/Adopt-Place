import { NextResponse } from "next/server";

import { getShowcaseFilterOptions } from "@/lib/queries/animal-showcase";

// Public catalog contract (SHOWCASE-01 / Issue #26): GET /api/catalogos.
// Public, no auth. Canonical species/breeds plus cities that currently have
// available animals, for forms and showcase filters. No private contact data.
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
