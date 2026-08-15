import { Prisma, StatusAnimal, TipoRegistroSaude } from "@prisma/client";

import {
  CANONICAL_SPECIES_NAMES,
  canonicalBreedsForSpecies,
  ensureAnimalCatalog,
} from "@/lib/animal-catalog";
import { prisma } from "@/lib/prisma";
import type { ShowcaseFilters } from "@/lib/schemas/showcase";

// 30 cabe exatamente nas grades de 1, 2, 3 e 5 colunas usadas pela vitrine e
// pela home, entao nenhuma pagina termina com uma fileira pela metade.
export const SHOWCASE_PAGE_SIZE = 30;

const tagHealthTypes: Partial<Record<ShowcaseFilters["tags"][number], TipoRegistroSaude>> = {
  vacinado: TipoRegistroSaude.VACINA,
  vermifugado: TipoRegistroSaude.CONTROLE_PARASITAS,
  testado: TipoRegistroSaude.TESTE_DOENCA,
};

function buildShowcaseWhere(filters: ShowcaseFilters): Prisma.AnimalWhereInput {
  const healthTagFilters = filters.tags
    .map((tag) => tagHealthTypes[tag])
    .filter((tipo): tipo is TipoRegistroSaude => Boolean(tipo))
    .map((tipo) => ({ registrosSaude: { some: { tipo } } }));

  return {
    status: StatusAnimal.DISPONIVEL,
    especieId: filters.especieId,
    racaId: filters.racaId,
    porte: filters.porte,
    sexo: filters.sexo,
    ...(filters.tags.includes("castrado") ? { castrado: true } : {}),
    ...(filters.cidade
      ? {
          OR: [
            { organizacao: { cidade: { contains: filters.cidade, mode: "insensitive" } } },
            { acolhedor: { cidade: { contains: filters.cidade, mode: "insensitive" } } },
          ],
        }
      : {}),
    AND: healthTagFilters,
  };
}

export async function getShowcaseAnimals(filters: ShowcaseFilters) {
  const where = buildShowcaseWhere(filters);
  const skip = (filters.page - 1) * SHOWCASE_PAGE_SIZE;

  const [animals, total] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { nome: "asc" }],
      skip,
      take: SHOWCASE_PAGE_SIZE,
      select: {
        id: true,
        nome: true,
        porte: true,
        sexo: true,
        idadeEstimada: true,
        castrado: true,
        status: true,
        fotos: {
          orderBy: [{ principal: "desc" }, { ordem: "asc" }],
          take: 1,
          select: { urlFoto: true },
        },
        especie: { select: { nome: true } },
        raca: { select: { nome: true } },
        registrosSaude: { select: { tipo: true } },
        organizacao: { select: { id: true, razaoSocial: true, cidade: true } },
        acolhedor: { select: { id: true, nomeCompleto: true, cidade: true } },
      },
    }),
    prisma.animal.count({ where }),
  ]);

  return {
    animals,
    pagination: {
      page: filters.page,
      perPage: SHOWCASE_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / SHOWCASE_PAGE_SIZE)),
    },
  };
}

export async function getShowcaseFilterOptions() {
  await ensureAnimalCatalog();

  const [especies, orgCities, fosterCities] = await prisma.$transaction([
    prisma.especie.findMany({
      where: { nome: { in: [...CANONICAL_SPECIES_NAMES] } },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        racas: {
          where: { animais: { some: { status: StatusAnimal.DISPONIVEL } } },
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, especieId: true },
        },
      },
    }),
    prisma.organizacao.findMany({
      where: { animais: { some: { status: StatusAnimal.DISPONIVEL } } },
      distinct: ["cidade"],
      orderBy: { cidade: "asc" },
      select: { cidade: true },
    }),
    prisma.acolhedorIndependente.findMany({
      where: { animais: { some: { status: StatusAnimal.DISPONIVEL } } },
      distinct: ["cidade"],
      orderBy: { cidade: "asc" },
      select: { cidade: true },
    }),
  ]);

  const speciesByName = new Map(especies.map((species) => [species.nome, species]));
  const canonicalSpecies = CANONICAL_SPECIES_NAMES.flatMap((speciesName) => {
    const species = speciesByName.get(speciesName);
    if (!species) return [];
    const breedsByName = new Map(species.racas.map((breed) => [breed.nome, breed]));
    const racas = canonicalBreedsForSpecies(speciesName).flatMap((breedName) => {
      const breed = breedsByName.get(breedName);
      return breed ? [breed] : [];
    });
    return [{ ...species, racas }];
  });
  const cities = Array.from(new Set([...orgCities, ...fosterCities].map((item) => item.cidade))).sort();

  return { especies: canonicalSpecies, cities };
}

/**
 * Cadastro e edição precisam da taxonomia completa. Diferente da vitrine,
 * uma raça ainda sem anúncio disponível continua sendo uma opção válida para
 * o responsável criar o primeiro animal daquela raça.
 */
export async function getAnimalManagementCatalog() {
  await ensureAnimalCatalog();

  const especies = await prisma.especie.findMany({
    where: { nome: { in: [...CANONICAL_SPECIES_NAMES] } },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      racas: {
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, especieId: true },
      },
    },
  });

  const speciesByName = new Map(especies.map((species) => [species.nome, species]));
  return CANONICAL_SPECIES_NAMES.flatMap((speciesName) => {
    const species = speciesByName.get(speciesName);
    if (!species) return [];
    const breedsByName = new Map(species.racas.map((breed) => [breed.nome, breed]));
    const racas = canonicalBreedsForSpecies(speciesName).flatMap((breedName) => {
      const breed = breedsByName.get(breedName);
      return breed ? [breed] : [];
    });
    return [{ ...species, racas }];
  });
}
