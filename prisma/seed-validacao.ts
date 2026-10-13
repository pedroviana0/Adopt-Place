/**
 * Prepara o banco do AMBIENTE DE VALIDACAO (branch `validacao` do Neon).
 *
 * - Apaga contas, animais, fotos, saude, solicitacoes, conversas e notificacoes.
 * - MANTEM os dados de referencia: municipios, especies, racas e catalogos de
 *   vacinas e doencas (o seed padrao nao repovoa as racas).
 * - Cria 4 contas: Cia Animal VR, SPA-VR, um adotante da equipe com triagem
 *   concluida e um admin da equipe. As senhas sao geradas e impressas no fim.
 *
 * Nao apaga arquivos do UploadThing: as fotos antigas sao compartilhadas com a
 * producao, entao so as linhas do banco sao removidas.
 *
 * Trava de seguranca: so roda se o host do DATABASE_URL for informado em
 * CONFIRMAR_HOST. Uso (PowerShell):
 *
 *   $env:DATABASE_URL="<connection string do branch validacao>"
 *   $env:CONFIRMAR_HOST="<host dessa connection string, ex.: ep-xxxx.neon.tech>"
 *   npx tsx prisma/seed-validacao.ts
 */
import { randomInt } from "node:crypto";

import { PrismaClient, PrecisaoCoordenada, TipoPerfil } from "@prisma/client";
import bcrypt from "bcryptjs";

import { normalizarNomeMunicipio } from "../lib/municipios";

const prisma = new PrismaClient();

const VOLTA_REDONDA = { codigoIbge: "3306305", cep: "27255000" } as const;

function hostDoBanco(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL nao definida.");
  return new URL(url).hostname;
}

function confirmarAlvo(): string {
  const host = hostDoBanco();
  const confirmado = process.env.CONFIRMAR_HOST?.trim();
  if (!confirmado || confirmado !== host) {
    throw new Error(
      `Abortado. O banco alvo e "${host}". Para limpar ESTE banco, defina ` +
        `CONFIRMAR_HOST="${host}" e rode de novo. Confira que e o branch validacao, nao a producao.`,
    );
  }
  return host;
}

/** Calcula os dois digitos verificadores de um CNPJ a partir dos 12 primeiros. */
function cnpjValido(base12: string): string {
  const calc = (digits: string): number => {
    const pesos = digits.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = digits.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc(base12);
  const d2 = calc(base12 + d1);
  return `${base12}${d1}${d2}`;
}

/** Senha legivel, sem caracteres ambiguos, que atende a letras + numero + simbolo. */
function gerarSenha(prefixo: string): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
  let sufixo = "";
  for (let i = 0; i < 6; i += 1) sufixo += alfabeto[randomInt(alfabeto.length)];
  return `${prefixo}@${sufixo}`;
}

async function localizacao() {
  const municipio = await prisma.municipio.findUnique({
    where: { codigoIbge: VOLTA_REDONDA.codigoIbge },
  });
  if (!municipio) throw new Error("Municipio de Volta Redonda ausente no banco.");
  return {
    cep: VOLTA_REDONDA.cep,
    cidade: municipio.nome,
    estado: municipio.uf,
    municipioId: municipio.codigoIbge,
    latitude: municipio.latitude,
    longitude: municipio.longitude,
    precisaoCoordenada: PrecisaoCoordenada.MUNICIPIO,
  };
}

async function limparDadosDeUso(): Promise<void> {
  await prisma.$transaction([
    prisma.notificacao.deleteMany(),
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
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.adotante.deleteMany(),
    prisma.organizacao.deleteMany(),
    prisma.acolhedorIndependente.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
}

type Credencial = { conta: string; email: string; senha: string };

async function criarOrganizacao(
  conta: string,
  email: string,
  razaoSocial: string,
  cnpjBase: string,
  telefone: string,
): Promise<Credencial> {
  const senha = gerarSenha("Validacao");
  await prisma.usuario.create({
    data: {
      email,
      senhaHash: await bcrypt.hash(senha, 12),
      tipoPerfil: TipoPerfil.ORGANIZACAO,
      ativo: true,
      organizacao: {
        create: {
          razaoSocial,
          razaoSocialNormalizada: normalizarNomeMunicipio(razaoSocial),
          descricao: "Conta do teste de aceitação do AdoptPlace. Os dados podem ser editados em Meu perfil.",
          cnpj: cnpjValido(cnpjBase),
          telefone,
          endereco: "Volta Redonda (endereço a completar em Meu perfil)",
          responsavelNome: `Responsável ${razaoSocial}`,
          ...(await localizacao()),
        },
      },
    },
  });
  return { conta, email, senha };
}

async function criarContas(): Promise<Credencial[]> {
  const credenciais: Credencial[] = [];

  credenciais.push(
    await criarOrganizacao(
      "Cia Animal VR",
      "ciaanimalvr@example.com",
      "Cia Animal VR",
      "900000000001",
      "(24) 90000-0101",
    ),
  );
  credenciais.push(
    await criarOrganizacao(
      "SPA-VR",
      "spavr@example.com",
      "SPA-VR",
      "900000000002",
      "(24) 90000-0102",
    ),
  );

  const senhaAdotante = gerarSenha("Adotante");
  await prisma.usuario.create({
    data: {
      email: "equipe.adotante@example.com",
      senhaHash: await bcrypt.hash(senhaAdotante, 12),
      tipoPerfil: TipoPerfil.ADOTANTE,
      ativo: true,
      adotante: {
        create: {
          nomeCompleto: "Equipe AdoptPlace (adotante de teste)",
          cpf: "90000000001",
          telefone: "(24) 90000-0103",
          endereco: "Rua de Teste, 10",
          ...(await localizacao()),
          motivoAdocao: "Quero um companheiro para a família.",
          tipoAnimalDesejado: "Cachorro ou gato",
          podeArcarCustosVet: true,
          adocaoParaPresente: false,
          moradiaPropria: true,
          numAdultosCasa: 2,
          temCriancas: false,
          todosConordamAdocao: true,
          janelasTeladas: true,
          murosSeguros: true,
          horasSozinho: "Até 4 horas",
          responsavelViagem: "Familiares cuidam do animal",
          alergicosNaCasa: false,
          cienteLongevidade: true,
          permiteVisitaProtetor: true,
          ciendeNaoRepassar: true,
          teveAnimaisAntes: true,
          animaisAnterioresDescricao: "Uma cadela, que viveu 14 anos.",
          temOutrosAnimais: false,
          triagemConcluida: true,
        },
      },
    },
  });
  credenciais.push({
    conta: "Adotante da equipe",
    email: "equipe.adotante@example.com",
    senha: senhaAdotante,
  });

  const senhaAdmin = gerarSenha("Admin");
  await prisma.usuario.create({
    data: {
      email: "admin.validacao@example.com",
      senhaHash: await bcrypt.hash(senhaAdmin, 12),
      tipoPerfil: TipoPerfil.ADMIN,
      ativo: true,
    },
  });
  credenciais.push({ conta: "Admin da equipe", email: "admin.validacao@example.com", senha: senhaAdmin });

  return credenciais;
}

async function main(): Promise<void> {
  const host = confirmarAlvo();
  console.log(`Limpando o banco ${host}...`);
  await limparDadosDeUso();
  const credenciais = await criarContas();

  const [especies, racas, municipios] = await Promise.all([
    prisma.especie.count(),
    prisma.raca.count(),
    prisma.municipio.count(),
  ]);
  console.log(`Mantidos: ${especies} especies, ${racas} racas, ${municipios} municipios.`);
  console.log("\nContas criadas (guarde agora, as senhas nao ficam salvas em lugar nenhum):\n");
  console.table(credenciais);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
