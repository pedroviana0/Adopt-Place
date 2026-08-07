-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('SOLICITACAO_RECEBIDA', 'SOLICITACAO_APROVADA', 'SOLICITACAO_RECUSADA', 'ADOCAO_CONCLUIDA');

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "href" TEXT,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notificacao_usuario_lida" ON "Notificacao"("usuarioId", "lidaEm");

-- CreateIndex
CREATE INDEX "idx_notificacao_usuario_criado" ON "Notificacao"("usuarioId", "criadoEm");

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
