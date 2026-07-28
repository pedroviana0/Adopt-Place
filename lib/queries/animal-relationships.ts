import { TipoPerfil } from "@prisma/client";

import type { ResponsibleContext } from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";

export async function getOwnedAnimalRelationships(
  animalId: string,
  context: ResponsibleContext,
) {
  const ownerWhere =
    context.tipoPerfil === TipoPerfil.ORGANIZACAO
      ? { organizacaoId: context.responsavelId }
      : { acolhedorId: context.responsavelId };

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, ...ownerWhere },
    select: {
      relacionadosA: {
        where: {
          animalRelacionado: ownerWhere,
        },
        orderBy: { animalRelacionado: { nome: "asc" } },
        select: {
          animalRelacionado: {
            select: {
              id: true,
              nome: true,
              status: true,
              fotos: {
                where: { principal: true },
                take: 1,
                select: { urlFoto: true },
              },
            },
          },
        },
      },
    },
  });

  return (
    animal?.relacionadosA.map(({ animalRelacionado }) => ({
      id: animalRelacionado.id,
      nome: animalRelacionado.nome,
      status: animalRelacionado.status,
      fotoPrincipal: animalRelacionado.fotos[0]?.urlFoto ?? null,
    })) ?? null
  );
}
