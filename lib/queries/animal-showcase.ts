import { Prisma, StatusAnimal, TipoRegistroSaude } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ShowcaseFilters } from "@/lib/schemas/showcase";

export const SHOWCASE_PAGE_SIZE = 12;

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
        organizacao: { select: { razaoSocial: true, cidade: true } },
        acolhedor: { select: { nomeCompleto: true, cidade: true } },
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
  const [especies, orgCities, fosterCities] = await prisma.$transaction([
    prisma.especie.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        racas: { orderBy: { nome: "asc" }, select: { id: true, nome: true, especieId: true } },
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

  const cities = Array.from(new Set([...orgCities, ...fosterCities].map((item) => item.cidade))).sort();

  return { especies, cities };
}
