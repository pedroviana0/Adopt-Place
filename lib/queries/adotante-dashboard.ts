import { prisma } from "@/lib/prisma";

export async function getAdopterDashboard(adotanteId: string) {
  return prisma.adotante.findUnique({
    where: { id: adotanteId },
    select: {
      id: true,
      nomeCompleto: true,
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
  });
}

export type AdopterDashboard = NonNullable<Awaited<ReturnType<typeof getAdopterDashboard>>>;
