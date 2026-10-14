-- AlterEnum
BEGIN;
-- Spec 009 (D1): RESGATADO deixa de existir. As linhas sao convertidas antes da
-- troca de tipo, porque o cast abaixo falha com qualquer valor fora do enum novo.
-- Irreversivel: depois daqui nao se sabe quais animais eram RESGATADO.
UPDATE "Animal" SET "status" = 'EM_CUIDADOS' WHERE "status" = 'RESGATADO';
CREATE TYPE "StatusAnimal_new" AS ENUM ('EM_CUIDADOS', 'DISPONIVEL', 'EM_PROCESSO_ADOCAO', 'ADOTADO');
ALTER TABLE "Animal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Animal" ALTER COLUMN "status" TYPE "StatusAnimal_new" USING ("status"::text::"StatusAnimal_new");
ALTER TYPE "StatusAnimal" RENAME TO "StatusAnimal_old";
ALTER TYPE "StatusAnimal_new" RENAME TO "StatusAnimal";
DROP TYPE "StatusAnimal_old";
ALTER TABLE "Animal" ALTER COLUMN "status" SET DEFAULT 'EM_CUIDADOS';
COMMIT;

-- AlterTable
ALTER TABLE "Animal" ALTER COLUMN "status" SET DEFAULT 'EM_CUIDADOS';

