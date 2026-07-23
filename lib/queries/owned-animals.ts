import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { OwnedAnimalFilters } from "@/lib/schemas/dashboard-filters";

type ResponsavelTipo = "ORGANIZACAO" | "ACOLHEDOR";

function buildOwnedAnimalsWhere(
  responsavelId: string,
  tipoPerfil: ResponsavelTipo,
): Prisma.AnimalWhereInput {
  if (tipoPerfil === "ORGANIZACAO") {
    return { organizacaoId: responsavelId };
  }
  return { acolhedorId: responsavelId };
}

export async function getOwnedAnimals(
  responsavelId: string,
  tipoPerfil: ResponsavelTipo,
  filters: OwnedAnimalFilters = {},
) {
  const where: Prisma.AnimalWhereInput = {
    ...buildOwnedAnimalsWhere(responsavelId, tipoPerfil),
    ...(filters.status ? { status: filters.status } : {}),
  };

  return prisma.animal.findMany({
    where,
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      status: true,
      especie: { select: { nome: true } },
      raca: { select: { nome: true } },
      fotos: {
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        take: 1,
        select: { urlFoto: true },
      },
      _count: {
        select: {
          solicitacoes: {
            where: { status: "EM_ANALISE" },
          },
        },
      },
    },
  });
}

export type OwnedAnimal = NonNullable<Awaited<ReturnType<typeof getOwnedAnimals>>>[number];
