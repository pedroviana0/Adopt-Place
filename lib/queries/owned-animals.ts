import { Prisma, TipoPerfil } from "@prisma/client";

import type {
  ResponsibleContext,
  ResponsibleRole,
} from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";
import type { OwnedAnimalFilters } from "@/lib/schemas/dashboard-filters";

export const ownedAnimalSummarySelect = {
  id: true,
  nome: true,
  status: true,
  porte: true,
  sexo: true,
  cor: true,
  idadeEstimada: true,
  castrado: true,
  especie: { select: { id: true, nome: true } },
  raca: { select: { id: true, nome: true } },
  fotos: {
    orderBy: [{ principal: "desc" as const }, { ordem: "asc" as const }],
    take: 1,
    select: {
      id: true,
      urlFoto: true,
      principal: true,
      ordem: true,
    },
  },
  _count: {
    select: {
      solicitacoes: {
        where: { status: "EM_ANALISE" as const },
      },
    },
  },
} satisfies Prisma.AnimalSelect;

export const ownedAnimalDetailSelect = {
  ...ownedAnimalSummarySelect,
  descricao: true,
  criadoEm: true,
  fotos: {
    orderBy: [{ principal: "desc" as const }, { ordem: "asc" as const }],
    select: {
      id: true,
      urlFoto: true,
      principal: true,
      ordem: true,
      criadoEm: true,
    },
  },
} satisfies Prisma.AnimalSelect;

type OwnedAnimalRecord = Prisma.AnimalGetPayload<{
  select: typeof ownedAnimalSummarySelect;
}>;

type OwnedAnimalDetailRecord = Prisma.AnimalGetPayload<{
  select: typeof ownedAnimalDetailSelect;
}>;

function buildOwnedAnimalsWhere(
  responsavelId: string,
  tipoPerfil: ResponsibleRole,
): Prisma.AnimalWhereInput {
  return tipoPerfil === TipoPerfil.ORGANIZACAO
    ? { organizacaoId: responsavelId }
    : { acolhedorId: responsavelId };
}

function buildFilterWhere(filters: OwnedAnimalFilters): Prisma.AnimalWhereInput {
  return {
    ...(filters.q
      ? { nome: { contains: filters.q, mode: "insensitive" as const } }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.especieId ? { especieId: filters.especieId } : {}),
    ...(filters.racaId ? { racaId: filters.racaId } : {}),
    ...(filters.porte ? { porte: filters.porte } : {}),
    ...(filters.sexo ? { sexo: filters.sexo } : {}),
  };
}

export async function getOwnedAnimals(
  responsavelId: string,
  tipoPerfil: ResponsibleRole,
  filters: OwnedAnimalFilters = {},
) {
  return prisma.animal.findMany({
    where: {
      ...buildOwnedAnimalsWhere(responsavelId, tipoPerfil),
      ...buildFilterWhere(filters),
    },
    orderBy: { nome: "asc" },
    select: ownedAnimalSummarySelect,
  });
}

export async function getOwnedAnimalById(
  id: string,
  context: ResponsibleContext,
) {
  return prisma.animal.findFirst({
    where: {
      id,
      ...buildOwnedAnimalsWhere(context.responsavelId, context.tipoPerfil),
    },
    select: ownedAnimalDetailSelect,
  });
}

export function toOwnedAnimalDTO(animal: OwnedAnimalRecord) {
  return {
    id: animal.id,
    nome: animal.nome,
    status: animal.status,
    porte: animal.porte,
    sexo: animal.sexo,
    cor: animal.cor,
    idadeEstimada: animal.idadeEstimada,
    castrado: animal.castrado,
    especie: animal.especie,
    raca: animal.raca,
    fotoPrincipal: animal.fotos[0] ?? null,
    solicitacoesEmAnalise: animal._count.solicitacoes,
  };
}

export function toOwnedAnimalDetailDTO(animal: OwnedAnimalDetailRecord) {
  return {
    ...toOwnedAnimalDTO(animal),
    descricao: animal.descricao,
    criadoEm: animal.criadoEm.toISOString(),
    fotos: animal.fotos.map((foto) => ({
      ...foto,
      criadoEm: foto.criadoEm.toISOString(),
    })),
  };
}

export type OwnedAnimal = OwnedAnimalRecord;
