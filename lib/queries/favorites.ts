import { StatusAnimal } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getAdopterFavorites(adotanteId: string) {
  return prisma.favorito.findMany({
    where: {
      adotanteId,
      animal: { status: StatusAnimal.DISPONIVEL },
    },
    select: {
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
          organizacao: { select: { razaoSocial: true, cidade: true } },
          acolhedor: { select: { nomeCompleto: true, cidade: true } },
        },
      },
    },
  });
}

export type AdopterFavorite = NonNullable<Awaited<ReturnType<typeof getAdopterFavorites>>>[number];
