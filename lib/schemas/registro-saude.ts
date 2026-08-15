import { z } from "zod";
import {
  idSchema,
  optionalTextSchema,
  requiredTextSchema,
  pastOrTodayDateSchema,
} from "./common";

const shortHealthText = requiredTextSchema.max(160, "Use no máximo 160 caracteres.");

const optionalHealthDetails = {
  titulo: optionalTextSchema.pipe(z.string().max(160, "O título deve ter no máximo 160 caracteres.").optional()),
  observacoes: optionalTextSchema,
  profissionalClinica: optionalTextSchema.pipe(z.string().max(200, "O profissional ou clínica deve ter no máximo 200 caracteres.").optional()),
};

export const vacinaRegistroSchema = z.object({
  tipoRegistro: z.literal("VACINA"),
  vacinaId: idSchema.optional(),
  nomeCustom: shortHealthText.optional(),
  dataAplicacao: pastOrTodayDateSchema,
  dataProximaDose: z.date().optional(),
  ...optionalHealthDetails,
}).strict();

export type VacinaRegistroInput = z.infer<typeof vacinaRegistroSchema>;

export const parasitaRegistroSchema = z.object({
  tipoRegistro: z.literal("CONTROLE_PARASITAS"),
  tipoMedicacao: shortHealthText,
  frequencia: shortHealthText,
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
  ...optionalHealthDetails,
}).strict();

export type ParasitaRegistroInput = z.infer<typeof parasitaRegistroSchema>;

export const testeDoencaSchema = z.object({
  tipoRegistro: z.literal("TESTE_DOENCA"),
  doencaId: idSchema.optional(),
  nomeCustom: shortHealthText.optional(),
  resultado: z.enum(["POSITIVO", "NEGATIVO"]),
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
  ...optionalHealthDetails,
}).strict();

export type TesteDoencaInput = z.infer<typeof testeDoencaSchema>;

export const medicamentoTratamentoSchema = z.object({
  tipoRegistro: z.literal("MEDICAMENTO_TRATAMENTO"),
  medicamentoTratamento: shortHealthText,
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
  ...optionalHealthDetails,
}).strict();

export type MedicamentoTratamentoInput = z.infer<
  typeof medicamentoTratamentoSchema
>;

export const procedimentoRegistroSchema = z.object({
  tipoRegistro: z.literal("PROCEDIMENTO"),
  procedimento: shortHealthText,
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
  ...optionalHealthDetails,
}).strict();

export type ProcedimentoRegistroInput = z.infer<
  typeof procedimentoRegistroSchema
>;

export const registroSaudeSchema = z.discriminatedUnion("tipoRegistro", [
  vacinaRegistroSchema,
  parasitaRegistroSchema,
  testeDoencaSchema,
  medicamentoTratamentoSchema,
  procedimentoRegistroSchema,
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
    if (data.dataProxima && data.dataProxima <= data.dataAplicacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data próxima deve ser posterior ao registro.",
        path: ["dataProxima"],
      });
    }
  }

  if (
    (data.tipoRegistro === "MEDICAMENTO_TRATAMENTO" ||
      data.tipoRegistro === "PROCEDIMENTO") &&
    data.dataProxima &&
    data.dataProxima <= data.dataAplicacao
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data próxima deve ser posterior ao registro.",
      path: ["dataProxima"],
    });
  }
});

export type RegistroSaudeInput = z.infer<typeof registroSaudeSchema>;

const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const registroSaudeHttpSchema = z.discriminatedUnion("tipoRegistro", [
  vacinaRegistroSchema.extend({
    dataAplicacao: isoDateSchema,
    dataProximaDose: isoDateSchema.optional(),
  }),
  parasitaRegistroSchema.extend({
    dataAplicacao: isoDateSchema,
    dataProxima: isoDateSchema.optional(),
  }),
  testeDoencaSchema.extend({
    dataAplicacao: isoDateSchema,
    dataProxima: isoDateSchema.optional(),
  }),
  medicamentoTratamentoSchema.extend({
    dataAplicacao: isoDateSchema,
    dataProxima: isoDateSchema.optional(),
  }),
  procedimentoRegistroSchema.extend({
    dataAplicacao: isoDateSchema,
    dataProxima: isoDateSchema.optional(),
  }),
]).superRefine((data, ctx) => {
  const parsed = registroSaudeSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      ctx.addIssue(issue);
    }
  }
});
