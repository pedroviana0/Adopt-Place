import { prisma } from "@/lib/prisma";

type TipoPerfil = "ORGANIZACAO" | "ACOLHEDOR";

export async function getOwnerRequestDetail(
  solicitacaoId: string,
  responsavelId: string,
  tipoPerfil: TipoPerfil,
) {
  const ownership =
    tipoPerfil === "ORGANIZACAO"
      ? { organizacaoId: responsavelId }
      : { acolhedorId: responsavelId };

  // Ownership is applied before any private screening field is selected.
  const request = await prisma.solicitacaoAdocao.findFirst({
    where: { id: solicitacaoId, animal: ownership },
    select: {
      id: true,
      status: true,
      dataSolicitacao: true,
      dataAtualizacao: true,
      observacoes: true,
      animal: { select: { id: true, nome: true } },
      adotante: {
        select: {
          id: true,
          nomeCompleto: true,
          telefone: true,
          cidade: true,
          estado: true,
          triagemConcluida: true,
          motivoAdocao: true,
          tipoAnimalDesejado: true,
          podeArcarCustosVet: true,
          adocaoParaPresente: true,
          adocaoParaPresenteDetalhe: true,
          tipoMoradia: true,
          moradiaPropria: true,
          numAdultosCasa: true,
          temCriancas: true,
          criancasFaixaEtaria: true,
          todosConordamAdocao: true,
          condominioPermiteAnimal: true,
          janelasTeladas: true,
          acessoRua: true,
          murosSeguros: true,
          horasSozinho: true,
          responsavelViagem: true,
          planoEmGravidez: true,
          alergicosNaCasa: true,
          alergicosNaCasaDetalhe: true,
          planoMudanca: true,
          historicoDevolucao: true,
          historicoPercaDescuido: true,
          cienteLongevidade: true,
          permiteVisitaProtetor: true,
          ciendeNaoRepassar: true,
          teveAnimaisAntes: true,
          animaisAnterioresDescricao: true,
          temOutrosAnimais: true,
          outrosAnimaisDescricao: true,
        },
      },
    },
  });

  if (!request) {
    return null;
  }

  const {
    todosConordamAdocao,
    ciendeNaoRepassar,
    ...screening
  } = request.adotante;

  return {
    id: request.id,
    status: request.status,
    dataSolicitacao: request.dataSolicitacao.toISOString(),
    dataAtualizacao: request.dataAtualizacao.toISOString(),
    observacoes: request.observacoes,
    animal: request.animal,
    adotante: {
      ...screening,
      todosConcordamAdocao: todosConordamAdocao,
      cienteNaoRepassar: ciendeNaoRepassar,
    },
  };
}

export type OwnerRequestDetail = NonNullable<
  Awaited<ReturnType<typeof getOwnerRequestDetail>>
>;
