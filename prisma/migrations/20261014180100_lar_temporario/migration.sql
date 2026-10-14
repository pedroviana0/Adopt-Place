-- CreateEnum
CREATE TYPE "SituacaoLT" AS ENUM ('NAO_SE_APLICA', 'PROCURANDO', 'EM_LT');

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "larTemporarioId" TEXT,
ADD COLUMN     "situacaoLT" "SituacaoLT" NOT NULL DEFAULT 'NAO_SE_APLICA';

-- CreateTable
CREATE TABLE "LarTemporario" (
    "id" TEXT NOT NULL,
    "organizacaoId" TEXT NOT NULL,
    "nomeTutor" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LarTemporario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_lar_temporario_organizacao_id" ON "LarTemporario"("organizacaoId");

-- CreateIndex
CREATE INDEX "idx_animal_lar_temporario_id" ON "Animal"("larTemporarioId");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_larTemporarioId_fkey" FOREIGN KEY ("larTemporarioId") REFERENCES "LarTemporario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LarTemporario" ADD CONSTRAINT "LarTemporario_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "Organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

