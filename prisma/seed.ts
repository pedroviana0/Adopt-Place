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

async function createDemoAnimals(): Promise<void> {
  const organizacao = await prisma.organizacao.findFirst();
  if (!organizacao) return;

  const cachorro = await prisma.especie.create({ data: { nome: "Cachorro" } });
  const gato = await prisma.especie.create({ data: { nome: "Gato" } });

  const animais = [
    {
      nome: "Thor",
      especieId: cachorro.id,
      porte: Porte.G,
      sexo: Sexo.M,
      cor: "Caramelo",
      idadeEstimada: "2 anos",
      castrado: true,
      descricao: "Dócil e cheio de energia. Adora crianças e passeios longos.",
      foto: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80",
    },
    {
      nome: "Luna",
      especieId: gato.id,
      porte: Porte.P,
      sexo: Sexo.F,
      cor: "Cinza",
      idadeEstimada: "1 ano",
      castrado: true,
      descricao: "Carinhosa e tranquila, ideal para apartamento.",
      foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80",
    },
    {
      nome: "Bela",
      especieId: cachorro.id,
      porte: Porte.M,
      sexo: Sexo.F,
      cor: "Preto e branco",
      idadeEstimada: "3 anos",
      castrado: true,
      descricao: "Companheira e obediente, já socializada com outros cães.",
      foto: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&q=80",
    },
    {
      nome: "Mia",
      especieId: gato.id,
      porte: Porte.P,
      sexo: Sexo.F,
      cor: "Tricolor",
      idadeEstimada: "8 meses",
      castrado: false,
      descricao: "Curiosa e brincalhona, adora um brinquedo de varinha.",
      foto: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80",
    },
    {
      nome: "Bidu",
      especieId: cachorro.id,
      porte: Porte.P,
      sexo: Sexo.M,
      cor: "Branco",
      idadeEstimada: "5 anos",
      castrado: true,
      descricao: "Calmo e caseiro, perfeito para quem busca um amigo tranquilo.",
      foto: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80",
    },
    {
      nome: "Nina",
      especieId: cachorro.id,
      porte: Porte.M,
      sexo: Sexo.F,
      cor: "Caramelo",
      idadeEstimada: "6 meses",
      castrado: false,
      descricao: "Filhote esperta e afetuosa, aprende rápido.",
      foto: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    },
  ] as const;

  for (const a of animais) {
    await prisma.animal.create({
      data: {
        nome: a.nome,
        especieId: a.especieId,
        porte: a.porte,
        sexo: a.sexo,
        cor: a.cor,
        idadeEstimada: a.idadeEstimada,
        castrado: a.castrado,
        descricao: a.descricao,
        status: StatusAnimal.DISPONIVEL,
        organizacaoId: organizacao.id,
        fotos: { create: { urlFoto: a.foto, principal: true, ordem: 0 } },
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
