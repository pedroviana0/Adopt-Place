import { TipoCuidadoPlanejado } from "@prisma/client";
import { z } from "zod";

import { idSchema, optionalTextSchema, requiredTextSchema } from "./common";
import { registroSaudeSchema } from "./registro-saude";

const futureDateSchema = z.coerce
  .date({ invalid_type_error: "Informe uma data valida." })
  .refine((date) => date > new Date(), "A data planejada deve ser futura.");

const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato AAAA-MM-DD.")
  .optional();

export const agendaSituationSchema = z.enum([
  "ATRASADO",
  "HOJE",
  "PROXIMO",
  "CONCLUIDO",
  "CANCELADO",
  "PROXIMOS_7_DIAS",
  "PROXIMOS_30_DIAS",
]);

export const consultaPlanejadaSchema = z.object({
  animalId: idSchema,
  dataHoraPlanejada: futureDateSchema,
  titulo: requiredTextSchema.max(160, "O titulo deve ter no maximo 160 caracteres."),
  observacoes: optionalTextSchema,
  localProfissional: optionalTextSchema.pipe(z.string().max(200, "O local ou profissional deve ter no máximo 200 caracteres.").optional()),
}).strict();

export const reagendarCuidadoSchema = z.object({
  dataHoraPlanejada: futureDateSchema,
}).strict();

export const cancelarCuidadoSchema = z.object({
  confirmado: z.literal(true, {
    errorMap: () => ({ message: "Confirme o cancelamento." }),
  }),
}).strict();

export const concluirCuidadoSchema = registroSaudeSchema;

export const agendaFilterSchema = z
  .object({
    animalId: idSchema.optional(),
    tipo: z.nativeEnum(TipoCuidadoPlanejado).optional(),
    situacao: agendaSituationSchema.optional(),
    from: dateParamSchema,
    to: dateParamSchema,
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data inicial deve ser anterior a data final.",
        path: ["to"],
      });
    }
  });

export type ConsultaPlanejadaInput = z.infer<typeof consultaPlanejadaSchema>;
export type ReagendarCuidadoInput = z.infer<typeof reagendarCuidadoSchema>;
export type ConcluirCuidadoInput = z.infer<typeof concluirCuidadoSchema>;
export type AgendaFilters = z.infer<typeof agendaFilterSchema>;
