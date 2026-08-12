-- Add profile presentation fields as nullable so existing rows remain valid.
ALTER TABLE "Organizacao"
ADD COLUMN "descricao" TEXT,
ADD COLUMN "fotoUrl" TEXT,
ADD COLUMN "razaoSocialNormalizada" TEXT;

ALTER TABLE "AcolhedorIndependente"
ADD COLUMN "descricao" TEXT,
ADD COLUMN "fotoUrl" TEXT;

-- Backfill with the PostgreSQL equivalent of normalizarNomeMunicipio():
-- remove supported Latin diacritics, lowercase, compress whitespace and trim.
UPDATE "Organizacao"
SET "razaoSocialNormalizada" = btrim(
  regexp_replace(
    lower(
      translate(
        "razaoSocial",
        'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝŸýÿ',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYYyy'
      )
    ),
    '\s+',
    ' ',
    'g'
  )
);

ALTER TABLE "Organizacao"
ALTER COLUMN "razaoSocialNormalizada" SET NOT NULL;

CREATE INDEX "idx_organizacao_razao_social_normalizada"
ON "Organizacao"("razaoSocialNormalizada");
