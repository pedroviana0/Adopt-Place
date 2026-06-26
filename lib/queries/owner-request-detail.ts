import { prisma } from "@/lib/prisma";

type TipoPerfil = "ORGANIZACAO" | "ACOLHEDOR";

export async function getOwnerRequestDetail(
  solicitacaoId: string,
  responsavelId: string,
  tipoPerfil: TipoPerfil,
) {
  // Ownership enforced at query level (FR-047)
  const solicitacao = await prisma.solicitacaoAdocao.findUnique({
    where: { id: solicitacaoId },
    include: {
      animal: {
        select: {
          id: true,
          nome: true,
          organizacaoId: true,
          acolhedorId: true,
        },
      },
      adotante: {
        select: {
          id: true,
          nomeCompleto: true,
          cpf: true,
          telefone: true,
          instagram: true,
          endereco: true,
          cidade: true,
          estado: true,
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

  // Return null if unauthorized (animal does not belong to this responsavel)
  if (!solicitacao?.animal) {
    return null;
  }

  const isAuthorized =
    (tipoPerfil === "ORGANIZACAO" && solicitacao.animal.organizacaoId === responsavelId) ||
    (tipoPerfil === "ACOLHEDOR" && solicitacao.animal.acolhedorId === responsavelId);

  if (!isAuthorized) {
    return null;
  }

  return {
    id: solicitacao.id,
    status: solicitacao.status,
    dataSolicitacao: solicitacao.dataSolicitacao,
    dataAtualizacao: solicitacao.dataAtualizacao,
    observacoes: solicitacao.observacoes,
    animal: {
      id: solicitacao.animal.id,
      nome: solicitacao.animal.nome,
    },
    adotante: solicitacao.adotante,
  };
}

export type OwnerRequestDetail = NonNullable<Awaited<ReturnType<typeof getOwnerRequestDetail>>>;
