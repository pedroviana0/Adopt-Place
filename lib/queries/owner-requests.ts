import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { OwnerRequestFilters } from "@/lib/schemas/dashboard-filters";

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
  filters: OwnerRequestFilters = {},
) {
  // Ownership enforced at query level (FR-047)
  const where: Prisma.SolicitacaoAdocaoWhereInput = {
    ...buildOwnershipFilter(responsavelId, tipoPerfil),
    ...(filters.status ? { status: filters.status } : {}),
  };

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
