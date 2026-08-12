import {
  PrismaClient,
  TipoPerfil,
  Porte,
  Sexo,
  StatusAnimal,
  PrecisaoCoordenada,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { normalizarNomeMunicipio } from "../lib/municipios";
import { seedMunicipios } from "./seed-municipios";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "AdoptPlace@2026";

async function clearTestData(): Promise<void> {
  await prisma.$transaction([
    prisma.mensagemAdocao.deleteMany(),
    prisma.conversaParticipante.deleteMany(),
    prisma.conversaAdocao.deleteMany(),
    prisma.documentoSaude.deleteMany(),
    prisma.cuidadoPlanejado.deleteMany(),
    prisma.favorito.deleteMany(),
    prisma.solicitacaoAdocao.deleteMany(),
    prisma.animalRelacionado.deleteMany(),
    prisma.registroSaude.deleteMany(),
    prisma.fotoAnimal.deleteMany(),
    prisma.animal.deleteMany(),
    prisma.raca.deleteMany(),
    prisma.especie.deleteMany(),
    prisma.vacinaCatalogo.deleteMany(),
    prisma.doencaCatalogo.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.adotante.deleteMany(),
    prisma.organizacao.deleteMany(),
    prisma.acolhedorIndependente.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
}

// Responsaveis espalhados por cidades diferentes: sem isso todos os animais
// ficam a mesma distancia e a ordenacao do Feels nao aparece na tela.
// Distancias a partir de Volta Redonda: 0, 8, 10, 36 e 60 km.
const CIDADES = {
  voltaRedonda: { codigoIbge: "3306305", cep: "27255000" },
  barraMansa: { codigoIbge: "3300407", cep: "27310000" },
  pinheiral: { codigoIbge: "3303955", cep: "27197000" },
  resende: { codigoIbge: "3304201", cep: "27511030" },
  angraDosReis: { codigoIbge: "3300100", cep: "23900570" },
} as const;

type ChaveCidade = keyof typeof CIDADES;

/**
 * Localizacao pronta a partir da tabela de municipios, sem chamar o provedor
 * de CEP: o seed precisa rodar offline e o provedor nunca foi fonte de
 * coordenada de qualquer forma.
 */
async function localizacaoDe(chave: ChaveCidade) {
  const { codigoIbge, cep } = CIDADES[chave];
  const municipio = await prisma.municipio.findUnique({ where: { codigoIbge } });

  if (!municipio) {
    throw new Error(
      `Municipio ${codigoIbge} ausente. Rode o seed de municipios antes.`,
    );
  }

  return {
    cep,
    cidade: municipio.nome,
    estado: municipio.uf,
    municipioId: municipio.codigoIbge,
    latitude: municipio.latitude,
    longitude: municipio.longitude,
    precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
  };
}

async function createDemoUsers(): Promise<void> {
  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.usuario.create({
    data: {
      email: "admin.teste@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADMIN,
      ativo: true,
    },
  });

  await prisma.usuario.create({
    data: {
      email: "organizacao.teste@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      organizacao: {
        create: {
          razaoSocial: "Organizacao de Teste AdoptPlace",
          razaoSocialNormalizada: normalizarNomeMunicipio(
            "Organizacao de Teste AdoptPlace",
          ),
          cnpj: "10000000000100",
          telefone: "(24) 90000-0001",
          endereco: "Rua Cem, 100",
          responsavelNome: "Responsavel de Teste",
          ...(await localizacaoDe("voltaRedonda")),
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "organizacao.resende@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      organizacao: {
        create: {
          razaoSocial: "Abrigo Serra da Bocaina",
          razaoSocialNormalizada: normalizarNomeMunicipio(
            "Abrigo Serra da Bocaina",
          ),
          cnpj: "10000000000280",
          telefone: "(24) 90000-0005",
          endereco: "Avenida Albino Rodrigues Neves, 300",
          responsavelNome: "Coordenacao do Abrigo",
          ...(await localizacaoDe("resende")),
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "acolhedor.teste@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ACOLHEDOR,
      ativo: true,
      acolhedor: {
        create: {
          nomeCompleto: "Acolhedor de Teste",
          cpf: "10000000000",
          telefone: "(24) 90000-0002",
          endereco: "Rua Vinte e Um, 45",
          ...(await localizacaoDe("barraMansa")),
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "acolhedor.angra@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ACOLHEDOR,
      ativo: true,
      acolhedor: {
        create: {
          nomeCompleto: "Acolhedora da Ilha",
          cpf: "40000000000",
          telefone: "(24) 90000-0006",
          endereco: "Estrada do Contorno, 88",
          ...(await localizacaoDe("angraDosReis")),
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "adotante.aprovado@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotante: {
        create: {
          nomeCompleto: "Adotante Aprovado de Teste",
          cpf: "20000000000",
          telefone: "(24) 90000-0003",
          endereco: "Rua Trinta e Tres, 12",
          triagemConcluida: true,
          ...(await localizacaoDe("voltaRedonda")),
        },
      },
    },
  });

  await prisma.usuario.create({
    data: {
      email: "adotante.pendente@example.com",
      senhaHash,
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotante: {
        create: {
          nomeCompleto: "Adotante Pendente de Teste",
          cpf: "30000000000",
          telefone: "(24) 90000-0004",
          endereco: "Rua Sete, 7",
          triagemConcluida: false,
          ...(await localizacaoDe("pinheiral")),
        },
      },
    },
  });
}

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const DOG_PHOTOS = [
  "1552053831-71594a27632d",
  "1587300003388-59208cc962cb",
  "1583512603805-3cc6b41f3edb",
  "1517849845537-4d257902454a",
  "1543466835-00a7907e9de1",
  "1561037404-61cd46aa615b",
  "1548199973-03cce0bbc87b",
  "1534361960057-19889db9621e",
  "1601758228041-f3b2795255f1",
  "1518717758536-85ae29035b6d",
].map(IMG);

const CAT_PHOTOS = [
  "1514888286974-6c03e2ca1dba",
  "1533738363-b7f9aef128ce",
  "1495360010541-f48722b34f7d",
  "1518791841217-8f162f1e1131",
  "1513245543132-31f507417b26",
  "1592194996308-7b43878e84a6",
  "1573865526739-10659fec78a5",
  "1478098711619-5ab0b478d6e6",
  "1526336024174-e58f5cb8b6ce",
  "1425082661705-1834bfd09dca",
].map(IMG);

// Nomes separados por genero: o sexo do animal e derivado da lista de onde o
// nome saiu, senao aparecem cartoes como "Thor — Cachorra pequena".
const DOG_NAMES_M = [
  "Thor", "Bidu", "Rex", "Max", "Luke", "Fred", "Bob", "Zeca", "Toby", "Bento",
  "Simba", "Duque",
];
const DOG_NAMES_F = [
  "Bela", "Nina", "Amora", "Mel", "Cacau", "Pipoca", "Aurora", "Frida",
  "Maia", "Lua",
];
const CAT_NAMES_M = [
  "Nino", "Salem", "Maru", "Oliver", "Otto", "Tom", "Félix", "Pipo", "Tigre",
  "Nick",
];
const CAT_NAMES_F = [
  "Luna", "Mia", "Fiona", "Amélie", "Pandora", "Nala", "Jade", "Chiara",
  "Lola", "Gaia", "Íris", "Pérola", "Zoe", "Pretinha",
];
const CORES = [
  "Caramelo", "Preto", "Branco", "Preto e branco", "Tricolor",
  "Cinza", "Rajado", "Marrom", "Dourado", "Malhado",
];
const IDADES = [
  "2 meses", "4 meses", "6 meses", "8 meses", "1 ano", "2 anos", "3 anos", "5 anos", "7 anos",
];
const PORTES = [Porte.P, Porte.M, Porte.G];
const DESCRICOES = [
  "Dócil e cheio de energia, adora companhia.",
  "Carinhoso e tranquilo, ideal para apartamento.",
  "Companheiro e obediente, já socializado.",
  "Curioso e brincalhão, cheio de personalidade.",
  "Calmo e caseiro, perfeito para dias tranquilos.",
  "Filhote esperto e afetuoso, aprende rápido.",
  "Sociável com outros animais e com crianças.",
  "Resgatado com muito cuidado, pronto para um lar.",
];

async function createDemoAnimals(): Promise<void> {
  // Distribuir entre responsaveis de cidades diferentes e o que faz a
  // ordenacao por distancia aparecer: com todos na mesma cidade, todo cartao
  // mostraria a mesma distancia.
  const [organizacoes, acolhedores] = await Promise.all([
    prisma.organizacao.findMany({ orderBy: { cnpj: "asc" }, select: { id: true } }),
    prisma.acolhedorIndependente.findMany({ orderBy: { cpf: "asc" }, select: { id: true } }),
  ]);

  const responsaveis = [
    ...organizacoes.map((o) => ({ organizacaoId: o.id, acolhedorId: null })),
    ...acolhedores.map((a) => ({ organizacaoId: null, acolhedorId: a.id })),
  ];

  if (responsaveis.length === 0) return;

  const cachorro = await prisma.especie.create({ data: { nome: "Cachorro" } });
  const gato = await prisma.especie.create({ data: { nome: "Gato" } });

  const TOTAL = 36;
  const contadores = new Map<string, number>();

  for (let i = 0; i < TOTAL; i++) {
    // Tres eixos independentes, por periodos que nao se alinham: especie troca
    // a cada 1, sexo a cada 2, responsavel a cada 4. Assim cada responsavel
    // recebe as quatro combinacoes — com periodos alinhados, uma cidade acabava
    // so com machos, ou so com gatos.
    const isDog = i % 2 === 0;
    const macho = (i >> 1) % 2 === 0;
    const responsavel = responsaveis[(i >> 2) % responsaveis.length];

    const nomes = isDog
      ? (macho ? DOG_NAMES_M : DOG_NAMES_F)
      : (macho ? CAT_NAMES_M : CAT_NAMES_F);
    // Um contador por balde: sem isso os nomes se repetem antes da lista acabar.
    const chaveBalde = `${isDog ? "dog" : "cat"}-${macho ? "m" : "f"}`;
    const idx = contadores.get(chaveBalde) ?? 0;
    contadores.set(chaveBalde, idx + 1);
    const fotos = isDog ? DOG_PHOTOS : CAT_PHOTOS;

    await prisma.animal.create({
      data: {
        nome: nomes[idx % nomes.length],
        especieId: isDog ? cachorro.id : gato.id,
        porte: isDog ? PORTES[i % 3] : i % 4 === 0 ? Porte.M : Porte.P,
        sexo: macho ? Sexo.M : Sexo.F,
        cor: CORES[i % CORES.length],
        idadeEstimada: IDADES[i % IDADES.length],
        castrado: i % 4 !== 0,
        descricao: DESCRICOES[i % DESCRICOES.length],
        status: StatusAnimal.DISPONIVEL,
        ...responsavel,
        // Duas fotos: um animal anunciado precisa do minimo da regra de
        // publicacao, senao o proprio dado de teste viola o produto.
        fotos: {
          create: [
            { urlFoto: fotos[idx % fotos.length], principal: true, ordem: 0 },
            { urlFoto: fotos[(idx + 1) % fotos.length], principal: false, ordem: 1 },
          ],
        },
      },
    });
  }
}

async function main(): Promise<void> {
  // Municipios sao dado de referencia: ficam fora do clearTestData e sao
  // populados antes das contas, que apontam para eles.
  await seedMunicipios(prisma);
  await clearTestData();
  await createDemoUsers();
  await createDemoAnimals();
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
