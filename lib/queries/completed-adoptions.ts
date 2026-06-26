import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type TipoPerfil = "ORGANIZACAO" | "ACOLHEDOR";

function buildOwnershipFilter(
  responsavelId: string,
  tipoPerfil: TipoPerfil,
): Prisma.SolicitacaoAdocaoWhereInput {
  if (tipoPerfil === "ORGANIZACAO") {
    return {
      animal: { organizacaoId: responsavelId },
    };
  }
  return {
    animal: { acolhedorId: responsavelId },
  };
}

export async function getCompletedAdoptions(
  responsavelId: string,
  tipoPerfil: TipoPerfil,
) {
  // Ownership enforced at query level (FR-048)
  const where = buildOwnershipFilter(responsavelId, tipoPerfil);
  where.status = "CONCLUIDA";

  return prisma.solicitacaoAdocao.findMany({
    where,
    orderBy: { dataAtualizacao: "desc" },
    select: {
      id: true,
      dataAtualizacao: true,
      animal: {
        select: {
          id: true,
          nome: true,
        },
      },
      adotante: {
        select: {
          id: true,
          nomeCompleto: true,
        },
      },
    },
  });
}

export type CompletedAdoption = NonNullable<Awaited<ReturnType<typeof getCompletedAdoptions>>>[number];
