import { Prisma, StatusAnimal } from "@prisma/client";

import { SHOWCASE_PAGE_SIZE } from "@/lib/queries/animal-showcase";
import { prisma } from "@/lib/prisma";
import type { PublicProfileCatalogFilters } from "@/lib/schemas/public-profiles";
import { getAnimalTags } from "@/lib/tags";

const publicOrganizationSelect = {
  id: true,
  razaoSocial: true,
  descricao: true,
  fotoUrl: true,
  endereco: true,
  cidade: true,
  estado: true,
} satisfies Prisma.OrganizacaoSelect;

const publicCatalogAnimalSelect = {
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
} satisfies Prisma.AnimalSelect;

export async function getPublicOrganizationProfile(
  id: string,
  filters: PublicProfileCatalogFilters,
) {
  const organization = await prisma.organizacao.findFirst({
    where: { id, usuario: { ativo: true } },
    select: publicOrganizationSelect,
  });

  if (!organization) return null;

  const where: Prisma.AnimalWhereInput = {
    organizacaoId: id,
    status: StatusAnimal.DISPONIVEL,
    especieId: filters.especieId,
    racaId: filters.racaId,
    porte: filters.porte,
    sexo: filters.sexo,
  };
  const availableOwnerScope: Prisma.AnimalWhereInput = {
    organizacaoId: id,
    status: StatusAnimal.DISPONIVEL,
  };
  const skip = (filters.page - 1) * SHOWCASE_PAGE_SIZE;

  const [animals, total, especies, racas] = await prisma.$transaction([
    prisma.animal.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { nome: "asc" }],
      skip,
      take: SHOWCASE_PAGE_SIZE,
      select: publicCatalogAnimalSelect,
    }),
    prisma.animal.count({ where }),
    prisma.especie.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.raca.findMany({
      where: { animais: { some: availableOwnerScope } },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, especieId: true },
    }),
  ]);

  return {
    profile: {
      id: organization.id,
      tipo: "ORGANIZACAO" as const,
      nome: organization.razaoSocial,
      descricao: organization.descricao,
      fotoUrl: organization.fotoUrl,
      municipio: organization.cidade,
      uf: organization.estado,
      endereco: organization.endereco,
    },
    catalog: {
      animals: animals.map((animal) => ({
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
        cidade: organization.cidade,
        responsavel: organization.razaoSocial,
        tags: getAnimalTags(animal),
      })),
      filterOptions: { especies, racas },
      pagination: {
        page: filters.page,
        perPage: SHOWCASE_PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / SHOWCASE_PAGE_SIZE)),
      },
    },
  };
}
