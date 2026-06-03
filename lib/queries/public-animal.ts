import { prisma } from "@/lib/prisma";

export async function getPublicAnimal(id: string) {
  return prisma.animal.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      porte: true,
      sexo: true,
      cor: true,
      idadeEstimada: true,
      castrado: true,
      descricao: true,
      status: true,
      criadoEm: true,
      especie: { select: { nome: true } },
      raca: { select: { nome: true } },
      fotos: {
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        select: { id: true, urlFoto: true, principal: true },
      },
      registrosSaude: {
        orderBy: { dataRegistro: "desc" },
        select: {
          id: true,
          tipo: true,
          dataRegistro: true,
          dataProxima: true,
          nomeVacina: true,
          tipoMedicamento: true,
          frequencia: true,
          nomeDoenca: true,
          resultado: true,
        },
      },
      organizacao: { select: { razaoSocial: true, cidade: true } },
      acolhedor: { select: { nomeCompleto: true, cidade: true } },
      relacionadosA: {
        select: {
          animalRelacionado: {
            select: {
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
              organizacao: { select: { razaoSocial: true, cidade: true } },
              acolhedor: { select: { nomeCompleto: true, cidade: true } },
            },
          },
        },
      },
    },
  });
}

export type PublicAnimal = NonNullable<Awaited<ReturnType<typeof getPublicAnimal>>>;
export type RelatedPublicAnimal = PublicAnimal["relacionadosA"][number]["animalRelacionado"];
