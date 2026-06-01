-- CreateEnum
CREATE TYPE "TipoPerfil" AS ENUM ('ADOTANTE', 'ORGANIZACAO', 'ACOLHEDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('P', 'M', 'G');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('RESGATADO', 'EM_CUIDADOS', 'DISPONIVEL', 'EM_PROCESSO_ADOCAO', 'ADOTADO');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('EM_ANALISE', 'APROVADA', 'RECUSADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "TipoMoradia" AS ENUM ('CASA', 'APARTAMENTO', 'SITIO_FAZENDA');

-- CreateEnum
CREATE TYPE "TipoRegistroSaude" AS ENUM ('VACINA', 'CONTROLE_PARASITAS', 'TESTE_DOENCA');

-- CreateEnum
CREATE TYPE "ResultadoTeste" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "tipoPerfil" "TipoPerfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adotante" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "instagram" TEXT,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "motivoAdocao" TEXT,
    "tipoAnimalDesejado" TEXT,
    "podeArcarCustosVet" BOOLEAN,
    "adocaoParaPresente" BOOLEAN,
    "adocaoParaPresenteDetalhe" TEXT,
    "tipoMoradia" "TipoMoradia",
    "moradiaPropria" BOOLEAN,
    "numAdultosCasa" INTEGER,
    "temCriancas" BOOLEAN,
    "criancasFaixaEtaria" TEXT,
    "todosConordamAdocao" BOOLEAN,
    "condominioPermiteAnimal" TEXT,
    "janelasTeladas" BOOLEAN,
    "acessoRua" TEXT,
    "murosSeguros" BOOLEAN,
    "horasSozinho" TEXT,
    "responsavelViagem" TEXT,
    "planoEmGravidez" TEXT,
    "alergicosNaCasa" BOOLEAN,
    "alergicosNaCasaDetalhe" TEXT,
    "planoMudanca" TEXT,
    "historicoDevolucao" TEXT,
    "historicoPercaDescuido" TEXT,
    "cienteLongevidade" BOOLEAN,
    "permiteVisitaProtetor" BOOLEAN,
    "ciendeNaoRepassar" BOOLEAN,
    "teveAnimaisAntes" BOOLEAN,
    "animaisAnterioresDescricao" TEXT,
    "temOutrosAnimais" BOOLEAN,
    "outrosAnimaisDescricao" TEXT,
    "triagemConcluida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Adotante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "responsavelNome" TEXT NOT NULL,
    "capacidadeMaxima" INTEGER,

    CONSTRAINT "Organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcolhedorIndependente" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "capacidadeAtual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AcolhedorIndependente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especie" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Especie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raca" (
    "id" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Raca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,
    "racaId" TEXT,
    "porte" "Porte" NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "cor" TEXT NOT NULL,
    "idadeEstimada" TEXT,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "status" "StatusAnimal" NOT NULL DEFAULT 'RESGATADO',
    "organizacaoId" TEXT,
    "acolhedorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalRelacionado" (
    "animalId" TEXT NOT NULL,
    "animalRelacionadoId" TEXT NOT NULL,

    CONSTRAINT "AnimalRelacionado_pkey" PRIMARY KEY ("animalId","animalRelacionadoId")
);

-- CreateTable
CREATE TABLE "FotoAnimal" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "urlFoto" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacinaCatalogo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "VacinaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoencaCatalogo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "DoencaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroSaude" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoRegistroSaude" NOT NULL,
    "dataRegistro" TIMESTAMP(3) NOT NULL,
    "dataProxima" TIMESTAMP(3),
    "responsavelRegistro" TEXT NOT NULL,
    "nomeVacina" TEXT,
    "ehVacinaCustomizada" BOOLEAN,
    "tipoMedicamento" TEXT,
    "frequencia" TEXT,
    "nomeDoenca" TEXT,
    "ehDoencaCustomizada" BOOLEAN,
    "resultado" "ResultadoTeste",

    CONSTRAINT "RegistroSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "adotanteId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("adotanteId","animalId")
);

-- CreateTable
CREATE TABLE "SolicitacaoAdocao" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "adotanteId" TEXT NOT NULL,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'EM_ANALISE',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "SolicitacaoAdocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Adotante_usuarioId_key" ON "Adotante"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Adotante_cpf_key" ON "Adotante"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Organizacao_usuarioId_key" ON "Organizacao"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Organizacao_cnpj_key" ON "Organizacao"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "AcolhedorIndependente_usuarioId_key" ON "AcolhedorIndependente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "AcolhedorIndependente_cpf_key" ON "AcolhedorIndependente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Especie_nome_key" ON "Especie"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Raca_especieId_nome_key" ON "Raca"("especieId", "nome");

-- CreateIndex
CREATE INDEX "idx_animal_status" ON "Animal"("status");

-- CreateIndex
CREATE INDEX "idx_animal_especie_id" ON "Animal"("especieId");

-- CreateIndex
CREATE INDEX "idx_animal_porte" ON "Animal"("porte");

-- CreateIndex
CREATE INDEX "idx_animal_sexo" ON "Animal"("sexo");

-- CreateIndex
CREATE INDEX "idx_animal_organizacao_id" ON "Animal"("organizacaoId");

-- CreateIndex
CREATE INDEX "idx_animal_acolhedor_id" ON "Animal"("acolhedorId");

-- CreateIndex
CREATE UNIQUE INDEX "VacinaCatalogo_nome_key" ON "VacinaCatalogo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "DoencaCatalogo_nome_key" ON "DoencaCatalogo"("nome");

-- CreateIndex
CREATE INDEX "idx_registro_saude_animal_id" ON "RegistroSaude"("animalId");

-- CreateIndex
CREATE INDEX "idx_registro_saude_tipo" ON "RegistroSaude"("tipo");

-- CreateIndex
CREATE INDEX "idx_solicitacao_adocao_adotante_id" ON "SolicitacaoAdocao"("adotanteId");

-- CreateIndex
CREATE INDEX "idx_solicitacao_adocao_animal_id" ON "SolicitacaoAdocao"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitacaoAdocao_animalId_adotanteId_key" ON "SolicitacaoAdocao"("animalId", "adotanteId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Adotante" ADD CONSTRAINT "Adotante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizacao" ADD CONSTRAINT "Organizacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcolhedorIndependente" ADD CONSTRAINT "AcolhedorIndependente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raca" ADD CONSTRAINT "Raca_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_racaId_fkey" FOREIGN KEY ("racaId") REFERENCES "Raca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_acolhedorId_fkey" FOREIGN KEY ("acolhedorId") REFERENCES "AcolhedorIndependente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalRelacionado" ADD CONSTRAINT "AnimalRelacionado_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalRelacionado" ADD CONSTRAINT "AnimalRelacionado_animalRelacionadoId_fkey" FOREIGN KEY ("animalRelacionadoId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoAnimal" ADD CONSTRAINT "FotoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSaude" ADD CONSTRAINT "RegistroSaude_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "Adotante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoAdocao" ADD CONSTRAINT "SolicitacaoAdocao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoAdocao" ADD CONSTRAINT "SolicitacaoAdocao_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "Adotante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

