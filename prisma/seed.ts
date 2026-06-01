import { PrismaClient, ResultadoTeste, StatusAnimal, StatusSolicitacao, TipoPerfil, TipoRegistroSaude } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  await prisma.registroSaude.createMany({
    data: [
      {
        animalId: animals[0].id,
        tipo: TipoRegistroSaude.VACINA,
        dataRegistro: new Date("2026-01-10"),
        dataProxima: new Date("2027-01-10"),
        responsavelRegistro: "Cia Animal VR",
        nomeVacina: "V10",
        ehVacinaCustomizada: false,
      },
      {
        animalId: animals[1].id,
        tipo: TipoRegistroSaude.CONTROLE_PARASITAS,
        dataRegistro: new Date("2026-02-15"),
        dataProxima: new Date("2026-05-15"),
        responsavelRegistro: "Cia Animal VR",
        tipoMedicamento: "Vermifugo oral",
        frequencia: "A cada 3 meses",
      },
      {
        animalId: animals[5].id,
        tipo: TipoRegistroSaude.TESTE_DOENCA,
        dataRegistro: new Date("2026-03-20"),
        responsavelRegistro: "SPA-VR",
        nomeDoenca: "FIV",
        ehDoencaCustomizada: false,
        resultado: ResultadoTeste.NEGATIVO,
      },
    ],
  });

  await prisma.solicitacaoAdocao.create({
    data: {
      animalId: animals[0].id,
      adotanteId,
      status: StatusSolicitacao.EM_ANALISE,
      observacoes: "Interesse inicial registrado pelo seed.",
    },
  });

  await prisma.favorito.createMany({
    data: [
      { animalId: animals[2].id, adotanteId },
      { animalId: animals[5].id, adotanteId },
    ],
  });
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
