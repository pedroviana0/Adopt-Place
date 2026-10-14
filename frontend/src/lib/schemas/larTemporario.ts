import { z } from "zod";

import { addressSchema, personNameSchema, phoneSchema } from "./common";

// Espelha lib/schemas/lar-temporario.ts (spec 009, RF-022a). O servidor valida
// de novo; aqui e so para a resposta imediata no formulario.
export const larTemporarioUpdateSchema = z.object({
  nomeTutor: personNameSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cidade: z
    .string()
    .trim()
    .min(2, "Informe a cidade.")
    .max(80, "A cidade deve ter no máximo 80 caracteres."),
  observacoes: z
    .string()
    .trim()
    .max(1000, "As observações devem ter no máximo 1.000 caracteres.")
    .optional(),
});

const autorizacaoMessage = "Confirme que o tutor autorizou o registro destes dados.";

// O checkbox comeca desmarcado, entao o formulario guarda boolean; no cadastro
// ele precisa estar marcado (C3). Na edicao nao aparece.
export function larTemporarioFormSchema(mode: "create" | "edit") {
  return larTemporarioUpdateSchema
    .extend({ autorizacaoTutor: z.boolean() })
    .superRefine((values, ctx) => {
      if (mode === "create" && !values.autorizacaoTutor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["autorizacaoTutor"],
          message: autorizacaoMessage,
        });
      }
    });
}

export type LarTemporarioUpdateInput = z.infer<typeof larTemporarioUpdateSchema>;
export type LarTemporarioFormValues = z.infer<ReturnType<typeof larTemporarioFormSchema>>;
// Contrato do POST: o backend exige `autorizacaoTutor: true` e nao o persiste.
export type LarTemporarioCreateInput = LarTemporarioUpdateInput & { autorizacaoTutor: true };
