-- AlterEnum
ALTER TYPE "TipoRegistroSaude" ADD VALUE 'MEDICAMENTO_TRATAMENTO';
ALTER TYPE "TipoRegistroSaude" ADD VALUE 'PROCEDIMENTO';

-- CreateEnum
CREATE TYPE "TipoCuidadoPlanejado" AS ENUM ('VACINA', 'CONTROLE_PARASITAS', 'TESTE_DOENCA', 'MEDICAMENTO_TRATAMENTO', 'PROCEDIMENTO', 'CONSULTA');

-- CreateEnum
CREATE TYPE "StatusCuidadoPlanejado" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoDocumentoSaude" AS ENUM ('EXAME', 'RECEITA', 'LAUDO', 'COMPROVANTE_VACINACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusConversaAdocao" AS ENUM ('ATIVA', 'ARQUIVADA');

-- AlterTable
ALTER TABLE "RegistroSaude"
ADD COLUMN "titulo" TEXT,
ADD COLUMN "procedimento" TEXT,
ADD COLUMN "medicamentoTratamento" TEXT,
ADD COLUMN "observacoes" TEXT,
ADD COLUMN "profissionalClinica" TEXT,
ADD COLUMN "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CuidadoPlanejado" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoCuidadoPlanejado" NOT NULL,
    "status" "StatusCuidadoPlanejado" NOT NULL DEFAULT 'PENDENTE',
    "dataHoraPlanejada" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "observacoes" TEXT,
    "localProfissional" TEXT,
    "origemRegistroSaudeId" TEXT,
    "registroRealizadoId" TEXT,
    "canceladoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuidadoPlanejado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoSaude" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "registroSaudeId" TEXT,
    "tipo" "TipoDocumentoSaude" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "chaveArquivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaAdocao" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "status" "StatusConversaAdocao" NOT NULL DEFAULT 'ATIVA',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arquivadaEm" TIMESTAMP(3),
    "atualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversaAdocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaParticipante" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ultimaLeituraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversaParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemAdocao" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "autorUsuarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemAdocao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroSaude_animalId_dataRegistro_idx" ON "RegistroSaude"("animalId", "dataRegistro");

-- CreateIndex
CREATE INDEX "RegistroSaude_tipo_resultado_idx" ON "RegistroSaude"("tipo", "resultado");

-- CreateIndex
CREATE UNIQUE INDEX "CuidadoPlanejado_origemRegistroSaudeId_key" ON "CuidadoPlanejado"("origemRegistroSaudeId");

-- CreateIndex
CREATE UNIQUE INDEX "CuidadoPlanejado_registroRealizadoId_key" ON "CuidadoPlanejado"("registroRealizadoId");

-- CreateIndex
CREATE INDEX "CuidadoPlanejado_animalId_idx" ON "CuidadoPlanejado"("animalId");

-- CreateIndex
CREATE INDEX "CuidadoPlanejado_status_dataHoraPlanejada_idx" ON "CuidadoPlanejado"("status", "dataHoraPlanejada");

-- CreateIndex
CREATE INDEX "CuidadoPlanejado_tipo_status_dataHoraPlanejada_idx" ON "CuidadoPlanejado"("tipo", "status", "dataHoraPlanejada");

-- CreateIndex
CREATE INDEX "DocumentoSaude_animalId_criadoEm_idx" ON "DocumentoSaude"("animalId", "criadoEm");

-- CreateIndex
CREATE INDEX "DocumentoSaude_registroSaudeId_idx" ON "DocumentoSaude"("registroSaudeId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversaAdocao_solicitacaoId_key" ON "ConversaAdocao"("solicitacaoId");

-- CreateIndex
CREATE INDEX "ConversaAdocao_status_atualizadaEm_idx" ON "ConversaAdocao"("status", "atualizadaEm");

-- CreateIndex
CREATE INDEX "ConversaParticipante_usuarioId_idx" ON "ConversaParticipante"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversaParticipante_conversaId_usuarioId_key" ON "ConversaParticipante"("conversaId", "usuarioId");

-- CreateIndex
CREATE INDEX "MensagemAdocao_conversaId_criadaEm_idx" ON "MensagemAdocao"("conversaId", "criadaEm");

-- CreateIndex
CREATE INDEX "MensagemAdocao_autorUsuarioId_idx" ON "MensagemAdocao"("autorUsuarioId");

-- AddForeignKey
ALTER TABLE "CuidadoPlanejado" ADD CONSTRAINT "CuidadoPlanejado_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuidadoPlanejado" ADD CONSTRAINT "CuidadoPlanejado_origemRegistroSaudeId_fkey" FOREIGN KEY ("origemRegistroSaudeId") REFERENCES "RegistroSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuidadoPlanejado" ADD CONSTRAINT "CuidadoPlanejado_registroRealizadoId_fkey" FOREIGN KEY ("registroRealizadoId") REFERENCES "RegistroSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoSaude" ADD CONSTRAINT "DocumentoSaude_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoSaude" ADD CONSTRAINT "DocumentoSaude_registroSaudeId_fkey" FOREIGN KEY ("registroSaudeId") REFERENCES "RegistroSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaAdocao" ADD CONSTRAINT "ConversaAdocao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoAdocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaParticipante" ADD CONSTRAINT "ConversaParticipante_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaAdocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaParticipante" ADD CONSTRAINT "ConversaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemAdocao" ADD CONSTRAINT "MensagemAdocao_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaAdocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemAdocao" ADD CONSTRAINT "MensagemAdocao_autorUsuarioId_fkey" FOREIGN KEY ("autorUsuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BackfillData
-- Existing next dates become one mutable planned-care occurrence. The unique
-- source key and conflict guard make this safe to rerun during recovery.
INSERT INTO "CuidadoPlanejado" (
    "id",
    "animalId",
    "tipo",
    "status",
    "dataHoraPlanejada",
    "titulo",
    "origemRegistroSaudeId",
    "criadoEm",
    "atualizadoEm"
)
SELECT
    CONCAT('cp_', registro."id"),
    registro."animalId",
    registro."tipo"::text::"TipoCuidadoPlanejado",
    'PENDENTE'::"StatusCuidadoPlanejado",
    registro."dataProxima",
    CASE registro."tipo"::text
        WHEN 'VACINA' THEN COALESCE(registro."nomeVacina", 'Proxima vacina')
        WHEN 'CONTROLE_PARASITAS' THEN COALESCE(registro."tipoMedicamento", 'Controle de parasitas')
        WHEN 'TESTE_DOENCA' THEN COALESCE(registro."nomeDoenca", 'Teste de doenca')
        WHEN 'MEDICAMENTO_TRATAMENTO' THEN COALESCE(registro."medicamentoTratamento", registro."titulo", 'Medicamento ou tratamento')
        WHEN 'PROCEDIMENTO' THEN COALESCE(registro."procedimento", registro."titulo", 'Procedimento')
    END,
    registro."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RegistroSaude" AS registro
WHERE registro."dataProxima" IS NOT NULL
ON CONFLICT ("origemRegistroSaudeId") DO NOTHING;
