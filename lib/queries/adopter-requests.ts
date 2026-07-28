import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const adopterRequestSelect = {
  id: true,
  status: true,
  dataSolicitacao: true,
  dataAtualizacao: true,
  observacoes: true,
  animal: {
    select: {
      id: true,
      nome: true,
      fotos: {
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        take: 1,
        select: { urlFoto: true },
      },
      organizacao: { select: { razaoSocial: true } },
      acolhedor: { select: { nomeCompleto: true } },
    },
  },
} satisfies Prisma.SolicitacaoAdocaoSelect;

type RequestRecord = Prisma.SolicitacaoAdocaoGetPayload<{
  select: typeof adopterRequestSelect;
}>;

export async function getAdopterRequests(adotanteId: string) {
  return prisma.solicitacaoAdocao.findMany({
    where: { adotanteId },
    orderBy: { dataSolicitacao: "desc" },
    select: adopterRequestSelect,
  });
}

export function toAdopterRequestDTO(request: RequestRecord) {
  return {
    id: request.id,
    status: request.status,
    dataSolicitacao: request.dataSolicitacao.toISOString(),
    dataAtualizacao: request.dataAtualizacao.toISOString(),
    observacoes: request.observacoes,
    animal: {
      id: request.animal.id,
      nome: request.animal.nome,
      fotoPrincipal: request.animal.fotos[0]?.urlFoto ?? null,
      responsavel:
        request.animal.organizacao?.razaoSocial ??
        request.animal.acolhedor?.nomeCompleto ??
        null,
    },
  };
}

export type AdopterRequest = ReturnType<typeof toAdopterRequestDTO>;
