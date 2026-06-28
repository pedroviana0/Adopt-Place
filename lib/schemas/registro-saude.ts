import { z } from "zod";
import { idSchema, requiredTextSchema, pastOrTodayDateSchema } from "./common";



export const vacinaRegistroSchema = z.object({
  tipoRegistro: z.literal("VACINA"),
  vacinaId: idSchema.optional(),
  nomeCustom: requiredTextSchema.optional(),
  dataAplicacao: pastOrTodayDateSchema,
  dataProximaDose: z.date().optional(),
});

export type VacinaRegistroInput = z.infer<typeof vacinaRegistroSchema>;

export const parasitaRegistroSchema = z.object({
  tipoRegistro: z.literal("CONTROLE_PARASITAS"),
  tipoMedicacao: requiredTextSchema,
  frequencia: requiredTextSchema,
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
});

export type ParasitaRegistroInput = z.infer<typeof parasitaRegistroSchema>;

export const testeDoencaSchema = z.object({
  tipoRegistro: z.literal("TESTE_DOENCA"),
  doencaId: idSchema.optional(),
  nomeCustom: requiredTextSchema.optional(),
  resultado: z.enum(["POSITIVO", "NEGATIVO"]),
  dataAplicacao: pastOrTodayDateSchema,
});

export type TesteDoencaInput = z.infer<typeof testeDoencaSchema>;

export const registroSaudeSchema = z.discriminatedUnion("tipoRegistro", [
  vacinaRegistroSchema,
  parasitaRegistroSchema,
  testeDoencaSchema,
]).superRefine((data, ctx) => {
  if (data.tipoRegistro === "VACINA") {
    if (data.vacinaId === undefined && data.nomeCustom === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma vacina do catálogo ou um nome customizado.",
        path: ["nomeCustom"],
      });
    }
    if (data.dataProximaDose && data.dataProximaDose <= data.dataAplicacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data próxima deve ser posterior ao registro.",
        path: ["dataProximaDose"],
      });
    }
  }

  if (data.tipoRegistro === "CONTROLE_PARASITAS") {
    if (data.dataProxima && data.dataProxima <= data.dataAplicacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data próxima deve ser posterior ao registro.",
        path: ["dataProxima"],
      });
    }
  }

  if (data.tipoRegistro === "TESTE_DOENCA") {
    if (data.doencaId === undefined && data.nomeCustom === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma doença do catálogo ou um nome customizado.",
        path: ["nomeCustom"],
      });
    }
  }
});

export type RegistroSaudeInput = z.infer<typeof registroSaudeSchema>;