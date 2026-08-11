-- CreateEnum
CREATE TYPE "PrecisaoCoordenada" AS ENUM ('MUNICIPIO', 'RUA');

-- AlterTable
ALTER TABLE "AcolhedorIndependente" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipioId" TEXT,
ADD COLUMN     "precisaoCoordenada" "PrecisaoCoordenada";

-- AlterTable
ALTER TABLE "Adotante" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipioId" TEXT,
ADD COLUMN     "precisaoCoordenada" "PrecisaoCoordenada";

-- AlterTable
ALTER TABLE "Organizacao" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipioId" TEXT,
ADD COLUMN     "precisaoCoordenada" "PrecisaoCoordenada";

-- CreateTable
CREATE TABLE "Municipio" (
    "codigoIbge" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Municipio_pkey" PRIMARY KEY ("codigoIbge")
);

-- CreateIndex
CREATE INDEX "idx_municipio_uf_nome" ON "Municipio"("uf", "nome");

-- CreateIndex
CREATE INDEX "idx_municipio_nome_normalizado" ON "Municipio"("nomeNormalizado");

-- CreateIndex
CREATE INDEX "idx_acolhedor_coordenada" ON "AcolhedorIndependente"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_organizacao_coordenada" ON "Organizacao"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "Adotante" ADD CONSTRAINT "Adotante_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("codigoIbge") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizacao" ADD CONSTRAINT "Organizacao_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("codigoIbge") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcolhedorIndependente" ADD CONSTRAINT "AcolhedorIndependente_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio"("codigoIbge") ON DELETE SET NULL ON UPDATE CASCADE;
