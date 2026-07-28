import { NextResponse } from "next/server";

import { getShowcaseAnimals } from "@/lib/queries/animal-showcase";
import { parseShowcaseFilters, type ShowcaseSearchParams } from "@/lib/schemas/showcase";
import { getAnimalTags } from "@/lib/tags";

// Public showcase list contract (SHOWCASE-01 / Issue #26): GET /api/animais.
// Public, no auth. Returns only allowlisted summary fields; private
// responsible/adopter/health-detail data never crosses this boundary.
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const params: ShowcaseSearchParams = {};
  for (const key of new Set(searchParams.keys())) {
    const all = searchParams.getAll(key);
    params[key] = all.length > 1 ? all : all[0];
  }

  const filters = parseShowcaseFilters(params);
  const { animals, pagination } = await getShowcaseAnimals(filters);

  const data = animals.map((animal) => ({
    id: animal.id,
    nome: animal.nome,
    porte: animal.porte,
    sexo: animal.sexo,
    idadeEstimada: animal.idadeEstimada,
    castrado: animal.castrado,
    status: animal.status,
    fotoPrincipal: animal.fotos[0]?.urlFoto ?? null,
    especie: animal.especie?.nome ?? null,
    raca: animal.raca?.nome ?? null,
    cidade: animal.organizacao?.cidade ?? animal.acolhedor?.cidade ?? null,
    responsavel: animal.organizacao?.razaoSocial ?? animal.acolhedor?.nomeCompleto ?? null,
    tags: getAnimalTags(animal),
  }));

  return NextResponse.json({ animals: data, pagination });
}
