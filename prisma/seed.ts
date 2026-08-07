import { PrismaClient, TipoPerfil, Porte, Sexo, StatusAnimal } from "@prisma/client";
import bcrypt from "bcryptjs";

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

async function createDemoUsers(): Promise<void> {
  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.$transaction([
    prisma.usuario.create({
      data: {
        email: "admin.teste@example.com",
        senhaHash,
        tipoPerfil: TipoPerfil.ADMIN,
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "organizacao.teste@example.com",
        senhaHash,
        tipoPerfil: TipoPerfil.ORGANIZACAO,
        ativo: true,
        organizacao: {
          create: {
            razaoSocial: "Organizacao de Teste AdoptPlace",
            cnpj: "10000000000100",
            telefone: "(24) 90000-0001",
            endereco: "Endereco de teste",
            cidade: "Volta Redonda",
            estado: "RJ",
            responsavelNome: "Responsavel de Teste",
          },
        },
      },
    }),
    prisma.usuario.create({
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
            endereco: "Endereco de teste",
            cidade: "Volta Redonda",
            estado: "RJ",
          },
        },
      },
    }),
    prisma.usuario.create({
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
            endereco: "Endereco de teste",
            cidade: "Volta Redonda",
            estado: "RJ",
            triagemConcluida: true,
          },
        },
      },
    }),
    prisma.usuario.create({
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
            endereco: "Endereco de teste",
            cidade: "Volta Redonda",
            estado: "RJ",
            triagemConcluida: false,
          },
        },
      },
    }),
  ]);
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

const DOG_NAMES = [
  "Thor", "Bela", "Bidu", "Nina", "Rex", "Max", "Luke", "Fred", "Bob", "Zeca",
  "Amora", "Mel", "Toby", "Cacau", "Pipoca", "Bento", "Aurora", "Simba", "Duque", "Frida",
];
const CAT_NAMES = [
  "Luna", "Mia", "Nino", "Fiona", "Salem", "Amélie", "Maru", "Pandora", "Oliver", "Nala",
  "Fumaça", "Jade", "Pretinha", "Chiara", "Lola", "Gaia", "Otto", "Íris", "Pérola", "Zoe",
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
  const organizacao = await prisma.organizacao.findFirst();
  if (!organizacao) return;

  const cachorro = await prisma.especie.create({ data: { nome: "Cachorro" } });
  const gato = await prisma.especie.create({ data: { nome: "Gato" } });

  const TOTAL = 36;
  let dogI = 0;
  let catI = 0;

  for (let i = 0; i < TOTAL; i++) {
    const isDog = i % 2 === 0;
    const idx = isDog ? dogI++ : catI++;
    const nome = isDog
      ? DOG_NAMES[idx % DOG_NAMES.length]
      : CAT_NAMES[idx % CAT_NAMES.length];
    const foto = isDog
      ? DOG_PHOTOS[idx % DOG_PHOTOS.length]
      : CAT_PHOTOS[idx % CAT_PHOTOS.length];

    await prisma.animal.create({
      data: {
        nome,
        especieId: isDog ? cachorro.id : gato.id,
        porte: isDog ? PORTES[i % 3] : i % 4 === 0 ? Porte.M : Porte.P,
        sexo: i % 3 === 0 || i % 5 === 0 ? Sexo.F : Sexo.M,
        cor: CORES[i % CORES.length],
        idadeEstimada: IDADES[i % IDADES.length],
        castrado: i % 4 !== 0,
        descricao: DESCRICOES[i % DESCRICOES.length],
        status: StatusAnimal.DISPONIVEL,
        organizacaoId: organizacao.id,
        fotos: { create: { urlFoto: foto, principal: true, ordem: 0 } },
      },
    });
  }
}

async function main(): Promise<void> {
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
