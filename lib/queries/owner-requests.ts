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

export async function getOwnerRequests(
  responsavelId: string,
  tipoPerfil: TipoPerfil,
) {
  // Ownership enforced at query level (FR-047)
  const where = buildOwnershipFilter(responsavelId, tipoPerfil);

  return prisma.solicitacaoAdocao.findMany({
    where,
    orderBy: { dataSolicitacao: "desc" },
    select: {
      id: true,
      status: true,
      dataSolicitacao: true,
      dataAtualizacao: true,
      animal: {
        select: {
          id: true,
          nome: true,
        },
      },
      adotante: {
        select: {
          nomeCompleto: true,
        },
      },
    },
  });
}

export type OwnerRequest = NonNullable<Awaited<ReturnType<typeof getOwnerRequests>>>[number];
