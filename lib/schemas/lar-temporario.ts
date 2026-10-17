import { z } from "zod";

import {
  addressSchema,
  idSchema,
  optionalTextSchema,
  personNameSchema,
  phoneSchema,
} from "@/lib/schemas/common";

// Campos provisorios do lar temporario (spec 009, C1): mudam quando chegar o
// formulario da Cia Animal. Validacao da 007 reaproveitada (RF-022a).
const larTemporarioFields = {
  nomeTutor: personNameSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cidade: z
    .string()
    .trim()
    .min(2, "Informe a cidade.")
    .max(80, "A cidade deve ter no máximo 80 caracteres."),
  observacoes: optionalTextSchema.pipe(
    z.string().max(1000, "As observações devem ter no máximo 1.000 caracteres.").optional(),
  ),
};

// O aceite da autorizacao do tutor e exigido no cadastro e nunca persistido
// (C3): a ONG declara que o tutor autorizou o registro dos dados.
export const larTemporarioCreateSchema = z
  .object({
    ...larTemporarioFields,
    autorizacaoTutor: z.literal(true, {
      errorMap: () => ({
        message: "Confirme que o tutor autorizou o registro destes dados.",
      }),
    }),
  })
  .strict("Revise os campos informados");

export const larTemporarioUpdateSchema = z
  .object(larTemporarioFields)
  .strict("Revise os campos informados");

export const vincularAnimalSchema = z
  .object({ animalId: idSchema })
  .strict("Revise os campos informados");

export type LarTemporarioCreateInput = z.infer<typeof larTemporarioCreateSchema>;
export type LarTemporarioUpdateInput = z.infer<typeof larTemporarioUpdateSchema>;
