import { Prisma, StatusAnimal } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAnimalTags } from "@/lib/tags";
import { formatPublicFosterName } from "@/lib/public-profile-name";

export const adopterFavoriteSelect = {
  animalId: true,
  criadoEm: true,
  animal: {
    select: {
      id: true,
      nome: true,
      status: true,
      idadeEstimada: true,
      especie: { select: { nome: true } },
      raca: { select: { nome: true } },
      porte: true,
      sexo: true,
      castrado: true,
      registrosSaude: { select: { tipo: true } },
      fotos: {
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        take: 1,
        select: { urlFoto: true },
      },
      organizacao: { select: { id: true, razaoSocial: true, cidade: true } },
      acolhedor: { select: { id: true, nomeCompleto: true, cidade: true } },
    },
  },
} satisfies Prisma.FavoritoSelect;

type FavoriteRecord = Prisma.FavoritoGetPayload<{
  select: typeof adopterFavoriteSelect;
}>;

export async function getAdopterFavorites(adotanteId: string) {
  return prisma.favorito.findMany({
    where: {
      adotanteId,
      animal: { status: StatusAnimal.DISPONIVEL },
    },
    orderBy: { criadoEm: "desc" },
    select: adopterFavoriteSelect,
  });
}

export function toFavoriteDTO(favorite: FavoriteRecord) {
  const { animal } = favorite;

  return {
    animalId: favorite.animalId,
    criadoEm: favorite.criadoEm.toISOString(),
    animal: {
      id: animal.id,
      nome: animal.nome,
      status: animal.status,
      idadeEstimada: animal.idadeEstimada,
      especie: animal.especie?.nome ?? null,
      raca: animal.raca?.nome ?? null,
      porte: animal.porte,
      sexo: animal.sexo,
      castrado: animal.castrado,
      fotoPrincipal: animal.fotos[0]?.urlFoto ?? null,
      responsavel:
        animal.organizacao?.razaoSocial ??
        (animal.acolhedor ? formatPublicFosterName(animal.acolhedor.nomeCompleto) : null) ??
        null,
      responsavelId: animal.organizacao?.id ?? animal.acolhedor?.id ?? null,
      responsavelTipo: animal.organizacao ? "ORGANIZACAO" as const : animal.acolhedor ? "ACOLHEDOR" as const : null,
      cidade: animal.organizacao?.cidade ?? animal.acolhedor?.cidade ?? null,
      tags: getAnimalTags(animal),
    },
  };
}

export type AdopterFavorite = ReturnType<typeof toFavoriteDTO>;
