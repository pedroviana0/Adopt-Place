import { prisma } from "@/lib/prisma";

export async function getAdopterRequests(adotanteId: string) {
  return prisma.solicitacaoAdocao.findMany({
    where: { adotanteId },
    orderBy: { dataSolicitacao: "desc" },
    select: {
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
    },
  });
}

export type AdopterRequest = NonNullable<Awaited<ReturnType<typeof getAdopterRequests>>>[number];
