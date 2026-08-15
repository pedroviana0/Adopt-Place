import { TipoDocumentoSaude } from "@prisma/client";
import { z } from "zod";

import { idSchema, requiredTextSchema } from "./common";

export const MAX_HEALTH_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const healthDocumentMimeSchema = z.string().refine(
  (mimeType) => mimeType === "application/pdf" || mimeType.startsWith("image/"),
  "Envie uma imagem ou arquivo PDF.",
);

export const documentoSaudeMetadataSchema = z.object({
  animalId: idSchema,
  registroSaudeId: idSchema.optional(),
  tipo: z.nativeEnum(TipoDocumentoSaude),
}).strict();

export const documentoSaudeUploadSchema = documentoSaudeMetadataSchema.extend({
  nomeArquivo: requiredTextSchema.max(
    255,
    "O nome do arquivo deve ter no maximo 255 caracteres.",
  ),
  mimeType: healthDocumentMimeSchema,
  tamanhoBytes: z
    .number()
    .int()
    .positive("O arquivo deve ter conteudo.")
    .max(MAX_HEALTH_DOCUMENT_BYTES, "O arquivo deve ter no maximo 10 MB."),
});

export const documentoSaudeFilterSchema = z
  .object({
    animalId: idSchema.optional(),
    tipo: z.nativeEnum(TipoDocumentoSaude).optional(),
  })
  .strict();

export type DocumentoSaudeMetadataInput = z.infer<
  typeof documentoSaudeMetadataSchema
>;
export type DocumentoSaudeUploadInput = z.infer<
  typeof documentoSaudeUploadSchema
>;
