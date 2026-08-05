import { PrismaClient, TipoPerfil } from "@prisma/client";
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

async function main(): Promise<void> {
  await clearTestData();
  await createDemoUsers();
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
