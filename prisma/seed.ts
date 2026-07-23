import {
  PrismaClient,
  ResultadoTeste,
  StatusAnimal,
  StatusConversaAdocao,
  StatusSolicitacao,
  TipoCuidadoPlanejado,
  TipoDocumentoSaude,
  TipoPerfil,
  TipoRegistroSaude,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { getApplicationDayBounds } from "../lib/date-utils";

const prisma = new PrismaClient();

async function main() {
  await prisma.mensagemAdocao.deleteMany();
  await prisma.conversaParticipante.deleteMany();
  await prisma.conversaAdocao.deleteMany();
  await prisma.documentoSaude.deleteMany();
  await prisma.cuidadoPlanejado.deleteMany();
  await prisma.favorito.deleteMany();
  await prisma.solicitacaoAdocao.deleteMany();
  await prisma.animalRelacionado.deleteMany();
  await prisma.registroSaude.deleteMany();
  await prisma.fotoAnimal.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.raca.deleteMany();
  await prisma.especie.deleteMany();
  await prisma.vacinaCatalogo.deleteMany();
  await prisma.doencaCatalogo.deleteMany();
  await prisma.adotante.deleteMany();
  await prisma.organizacao.deleteMany();
  await prisma.acolhedorIndependente.deleteMany();
  await prisma.usuario.deleteMany();

  await prisma.vacinaCatalogo.createMany({
    data: [
      { nome: "V8" },
      { nome: "V10" },
      { nome: "Antirrabica" },
      { nome: "Gripe Felina" },
      { nome: "FeLV (vacina)" },
      { nome: "Giardia" },
    ],
  });

  await prisma.doencaCatalogo.createMany({
    data: [
      { nome: "FIV" },
      { nome: "FeLV" },
      { nome: "Leishmaniose" },
      { nome: "Erliquiose" },
      { nome: "Babesiose" },
      { nome: "Cinomose" },
      { nome: "Parvovirose" },
    ],
  });

  const cachorro = await prisma.especie.create({
    data: {
      nome: "Cachorro",
      racas: {
        create: [{ nome: "SRD" }, { nome: "Labrador" }, { nome: "Poodle" }, { nome: "Pit Bull" }],
      },
    },
    include: { racas: true },
  });

  const gato = await prisma.especie.create({
    data: {
      nome: "Gato",
      racas: {
        create: [{ nome: "SRD" }, { nome: "Siames" }, { nome: "Persa" }],
      },
    },
    include: { racas: true },
  });

  const coelho = await prisma.especie.create({
    data: {
      nome: "Coelho",
      racas: {
        create: [{ nome: "SRD" }],
      },
    },
    include: { racas: true },
  });

  const senhaHash = await bcrypt.hash("test1234", 12);

  const cia = await prisma.usuario.create({
    data: {
      email: "org@ciaanimal.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: {
        create: {
          razaoSocial: "Cia Animal VR",
          cnpj: "11222333000144",
          telefone: "(24) 99999-1000",
          endereco: "Rua Voluntarios, 100",
          cidade: "Volta Redonda",
          estado: "RJ",
          responsavelNome: "Responsavel Cia Animal",
        },
      },
    },
    include: { organizacao: true },
  });

  const spa = await prisma.usuario.create({
    data: {
      email: "org@spavr.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      organizacao: {
        create: {
          razaoSocial: "SPA-VR",
          cnpj: "22333444000155",
          telefone: "(24) 99999-2000",
          endereco: "Estrada do Abrigo, 200",
          cidade: "Volta Redonda",
          estado: "RJ",
          responsavelNome: "Responsavel SPA-VR",
          capacidadeMaxima: 120,
        },
      },
    },
    include: { organizacao: true },
  });

  const acolhedor = await prisma.usuario.create({
    data: {
      email: "acolhedor@teste.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ACOLHEDOR,
      acolhedor: {
        create: {
          nomeCompleto: "Acolhedor Teste",
          cpf: "12345678901",
          telefone: "(24) 99999-3000",
          endereco: "Rua Lar Temporario, 300",
          cidade: "Volta Redonda",
          estado: "RJ",
          capacidadeAtual: 2,
        },
      },
    },
    include: { acolhedor: true },
  });

  const adotante = await prisma.usuario.create({
    data: {
      email: "adotante@teste.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADOTANTE,
      adotante: {
        create: {
          nomeCompleto: "Adotante Triado",
          cpf: "98765432100",
          telefone: "(24) 99999-4000",
          endereco: "Rua do Adotante, 400",
          cidade: "Volta Redonda",
          estado: "RJ",
          motivoAdocao: "Companhia",
          tipoAnimalDesejado: "Cachorro ou gato",
          podeArcarCustosVet: true,
          adocaoParaPresente: false,
          moradiaPropria: true,
          numAdultosCasa: 2,
          temCriancas: false,
          todosConordamAdocao: true,
          janelasTeladas: true,
          murosSeguros: true,
          horasSozinho: "4 horas",
          responsavelViagem: "Familiar",
          alergicosNaCasa: false,
          cienteLongevidade: true,
          permiteVisitaProtetor: true,
          ciendeNaoRepassar: true,
          teveAnimaisAntes: true,
          temOutrosAnimais: false,
          triagemConcluida: true,
        },
      },
    },
    include: { adotante: true },
  });

  await prisma.usuario.create({
    data: {
      email: "adotante2@teste.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADOTANTE,
      adotante: {
        create: {
          nomeCompleto: "Adotante Sem Triagem",
          cpf: "98765432101",
          telefone: "(24) 99999-5000",
          endereco: "Rua Sem Triagem, 500",
          cidade: "Volta Redonda",
          estado: "RJ",
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "admin@adoptplace.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADMIN,
    },
  });

  const organizacaoCiaId = cia.organizacao?.id;
  const organizacaoSpaId = spa.organizacao?.id;
  const acolhedorId = acolhedor.acolhedor?.id;
  const adotanteId = adotante.adotante?.id;

  if (!organizacaoCiaId || !organizacaoSpaId || !acolhedorId || !adotanteId) {
    throw new Error("Seed profiles were not created");
  }

  const cachorroSrdId = cachorro.racas.find((raca) => raca.nome === "SRD")?.id;
  const gatoSrdId = gato.racas.find((raca) => raca.nome === "SRD")?.id;
  const coelhoSrdId = coelho.racas.find((raca) => raca.nome === "SRD")?.id;

  const animals = await Promise.all([
    prisma.animal.create({ data: animalData("Luna", cachorro.id, cachorroSrdId, "M", "F", organizacaoCiaId, null, true) }),
    prisma.animal.create({ data: animalData("Thor", cachorro.id, cachorroSrdId, "G", "M", organizacaoCiaId, null, false) }),
    prisma.animal.create({ data: animalData("Mel", gato.id, gatoSrdId, "P", "F", organizacaoCiaId, null, true) }),
    prisma.animal.create({ data: animalData("Nina", gato.id, gatoSrdId, "P", "F", organizacaoCiaId, null, false) }),
    prisma.animal.create({ data: animalData("Bob", cachorro.id, cachorroSrdId, "M", "M", organizacaoSpaId, null, true) }),
    prisma.animal.create({ data: animalData("Mia", gato.id, gatoSrdId, "P", "F", organizacaoSpaId, null, true) }),
    prisma.animal.create({ data: animalData("Rex", cachorro.id, cachorroSrdId, "G", "M", organizacaoSpaId, null, false) }),
    prisma.animal.create({ data: animalData("Sol", coelho.id, coelhoSrdId, "P", "F", organizacaoSpaId, null, false) }),
    prisma.animal.create({ data: animalData("Tico", cachorro.id, cachorroSrdId, "P", "M", null, acolhedorId, true) }),
    prisma.animal.create({ data: animalData("Frida", gato.id, gatoSrdId, "P", "F", null, acolhedorId, true) }),
  ]);

  await prisma.animalRelacionado.createMany({
    data: [
      { animalId: animals[0].id, animalRelacionadoId: animals[1].id },
      { animalId: animals[1].id, animalRelacionadoId: animals[0].id },
      { animalId: animals[4].id, animalRelacionadoId: animals[5].id },
      { animalId: animals[5].id, animalRelacionadoId: animals[4].id },
    ],
  });

  const today = scheduledDate(0);
  const overdue = scheduledDate(-1);
  const next7Days = scheduledDate(3);
  const next30Days = scheduledDate(14);

  const [vaccineRecord, parasiteRecord, procedureRecord, treatmentRecord] =
    await Promise.all([
      prisma.registroSaude.create({
        data: {
          animalId: animals[0].id,
          tipo: TipoRegistroSaude.VACINA,
          dataRegistro: scheduledDate(-365),
          dataProxima: today,
          responsavelRegistro: "Cia Animal VR",
          nomeVacina: "V10",
          ehVacinaCustomizada: false,
        },
      }),
      prisma.registroSaude.create({
        data: {
          animalId: animals[1].id,
          tipo: TipoRegistroSaude.CONTROLE_PARASITAS,
          dataRegistro: scheduledDate(-91),
          dataProxima: overdue,
          responsavelRegistro: "Cia Animal VR",
          tipoMedicamento: "Vermifugo oral",
          frequencia: "A cada 3 meses",
        },
      }),
      prisma.registroSaude.create({
        data: {
          animalId: animals[2].id,
          tipo: TipoRegistroSaude.PROCEDIMENTO,
          dataRegistro: scheduledDate(-30),
          dataProxima: next7Days,
          responsavelRegistro: "Cia Animal VR",
          procedimento: "Revisao de curativo",
          titulo: "Acompanhamento de procedimento",
        },
      }),
      prisma.registroSaude.create({
        data: {
          animalId: animals[3].id,
          tipo: TipoRegistroSaude.MEDICAMENTO_TRATAMENTO,
          dataRegistro: scheduledDate(-14),
          dataProxima: next30Days,
          responsavelRegistro: "Cia Animal VR",
          medicamentoTratamento: "Reavaliacao do tratamento dermatologico",
          titulo: "Tratamento dermatologico",
        },
      }),
    ]);

  await prisma.registroSaude.create({
    data: {
      animalId: animals[4].id,
      tipo: TipoRegistroSaude.TESTE_DOENCA,
      dataRegistro: scheduledDate(-5),
      responsavelRegistro: "SPA-VR",
      nomeDoenca: "Leishmaniose",
      ehDoencaCustomizada: false,
      resultado: ResultadoTeste.POSITIVO,
      observacoes: "Resultado positivo demonstrativo para acompanhamento.",
      profissionalClinica: "Clinica Veterinaria Central",
    },
  });

  const negativeTest = await prisma.registroSaude.create({
    data: {
      animalId: animals[5].id,
      tipo: TipoRegistroSaude.TESTE_DOENCA,
      dataRegistro: scheduledDate(-20),
      responsavelRegistro: "SPA-VR",
      nomeDoenca: "FIV",
      ehDoencaCustomizada: false,
      resultado: ResultadoTeste.NEGATIVO,
    },
  });

  await prisma.cuidadoPlanejado.createMany({
    data: [
      {
        animalId: animals[0].id,
        tipo: TipoCuidadoPlanejado.VACINA,
        dataHoraPlanejada: today,
        titulo: "Proxima dose V10",
        origemRegistroSaudeId: vaccineRecord.id,
      },
      {
        animalId: animals[1].id,
        tipo: TipoCuidadoPlanejado.CONTROLE_PARASITAS,
        dataHoraPlanejada: overdue,
        titulo: "Vermifugo oral",
        origemRegistroSaudeId: parasiteRecord.id,
      },
      {
        animalId: animals[2].id,
        tipo: TipoCuidadoPlanejado.PROCEDIMENTO,
        dataHoraPlanejada: next7Days,
        titulo: "Revisao de curativo",
        origemRegistroSaudeId: procedureRecord.id,
      },
      {
        animalId: animals[3].id,
        tipo: TipoCuidadoPlanejado.MEDICAMENTO_TRATAMENTO,
        dataHoraPlanejada: next30Days,
        titulo: "Reavaliar tratamento dermatologico",
        origemRegistroSaudeId: treatmentRecord.id,
      },
      {
        animalId: animals[0].id,
        tipo: TipoCuidadoPlanejado.CONSULTA,
        dataHoraPlanejada: scheduledDate(2),
        titulo: "Consulta de retorno",
        observacoes: "Levar resultados dos exames.",
        localProfissional: "Clinica Veterinaria Central",
      },
    ],
  });

  await prisma.documentoSaude.create({
    data: {
      animalId: animals[5].id,
      registroSaudeId: negativeTest.id,
      tipo: TipoDocumentoSaude.EXAME,
      nomeArquivo: "resultado-fiv-seed.pdf",
      mimeType: "application/pdf",
      tamanhoBytes: 128_000,
      urlArquivo: "https://utfs.io/f/seed-health-document.pdf",
      chaveArquivo: "seed-health-document",
    },
  });

  await prisma.solicitacaoAdocao.create({
    data: {
      animalId: animals[0].id,
      adotanteId,
      status: StatusSolicitacao.EM_ANALISE,
      observacoes: "Interesse inicial registrado pelo seed.",
    },
  });

  const activeRequest = await prisma.solicitacaoAdocao.create({
    data: {
      animalId: animals[1].id,
      adotanteId,
      status: StatusSolicitacao.APROVADA,
      observacoes: "Solicitacao aprovada para demonstrar chat ativo.",
    },
  });
  const completedRequest = await prisma.solicitacaoAdocao.create({
    data: {
      animalId: animals[2].id,
      adotanteId,
      status: StatusSolicitacao.CONCLUIDA,
      observacoes: "Adocao concluida para demonstrar chat arquivado.",
    },
  });

  await prisma.animal.update({
    where: { id: animals[1].id },
    data: { status: StatusAnimal.EM_PROCESSO_ADOCAO },
  });
  await prisma.animal.update({
    where: { id: animals[2].id },
    data: { status: StatusAnimal.ADOTADO },
  });

  await prisma.conversaAdocao.create({
    data: {
      solicitacaoId: activeRequest.id,
      participantes: {
        create: [{ usuarioId: adotante.id }, { usuarioId: cia.id }],
      },
      mensagens: {
        create: {
          autorUsuarioId: cia.id,
          texto: "A solicitacao foi aprovada. Vamos combinar a entrega.",
        },
      },
    },
  });
  await prisma.conversaAdocao.create({
    data: {
      solicitacaoId: completedRequest.id,
      status: StatusConversaAdocao.ARQUIVADA,
      arquivadaEm: new Date(),
      participantes: {
        create: [{ usuarioId: adotante.id }, { usuarioId: cia.id }],
      },
      mensagens: {
        create: {
          autorUsuarioId: adotante.id,
          texto: "Entrega concluida. Obrigado pelo acompanhamento.",
        },
      },
    },
  });

  await prisma.favorito.createMany({
    data: [
      { animalId: animals[2].id, adotanteId },
      { animalId: animals[5].id, adotanteId },
    ],
  });
}

function scheduledDate(dayOffset: number): Date {
  const { start } = getApplicationDayBounds();
  return new Date(start.getTime() + dayOffset * 86_400_000 + 12 * 60 * 60 * 1000);
}

function animalData(
  nome: string,
  especieId: string,
  racaId: string | undefined,
  porte: "P" | "M" | "G",
  sexo: "M" | "F",
  organizacaoId: string | null,
  acolhedorId: string | null,
  castrado: boolean,
) {
  return {
    nome,
    especieId,
    racaId,
    porte,
    sexo,
    cor: "Caramelo",
    idadeEstimada: "2 anos",
    castrado,
    descricao: `${nome} esta pronto para encontrar uma familia.`,
    status: StatusAnimal.DISPONIVEL,
    organizacaoId,
    acolhedorId,
    fotos: {
      create: {
        urlFoto: `/placeholders/${nome.toLowerCase()}.jpg`,
        principal: true,
        ordem: 0,
      },
    },
  };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
