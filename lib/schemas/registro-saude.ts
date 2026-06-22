import { z } from "zod";
import { idSchema, requiredTextSchema, pastOrTodayDateSchema } from "./common";

const tipoRegistroSchema = z.enum(["VACINA", "CONTROLE_PARASITAS", "TESTE_DOENCA"]);

export const vacinaRegistroSchema = z.object({
  tipoRegistro: z.literal("VACINA"),
  vacinaId: idSchema.optional(),
  nomeCustom: requiredTextSchema.optional(),
  dataAplicacao: pastOrTodayDateSchema,
  dataProximaDose: z.date().optional(),
}).refine(
  (data) => data.vacinaId !== undefined || data.nomeCustom !== undefined,
  "Informe uma vacina do catálogo ou um nome customizado.",
).refine(
  (data) => !data.dataProximaDose || data.dataProximaDose > data.dataAplicacao,
  {
    path: ["dataProximaDose"],
    message: "Data próxima deve ser posterior ao registro.",
  },
);

export type VacinaRegistroInput = z.infer<typeof vacinaRegistroSchema>;

export const parasitaRegistroSchema = z.object({
  tipoRegistro: z.literal("CONTROLE_PARASITAS"),
  tipoMedicacao: requiredTextSchema,
  frequencia: requiredTextSchema,
  dataAplicacao: pastOrTodayDateSchema,
  dataProxima: z.date().optional(),
}).refine(
  (data) => !data.dataProxima || data.dataProxima > data.dataAplicacao,
  {
    path: ["dataProxima"],
    message: "Data próxima deve ser posterior ao registro.",
  },
);

export type ParasitaRegistroInput = z.infer<typeof parasitaRegistroSchema>;

export const testeDoencaSchema = z.object({
  tipoRegistro: z.literal("TESTE_DOENCA"),
  doencaId: idSchema.optional(),
  nomeCustom: requiredTextSchema.optional(),
  resultado: z.enum(["POSITIVO", "NEGATIVO"]),
  dataAplicacao: pastOrTodayDateSchema,
}).refine(
  (data) => data.doencaId !== undefined || data.nomeCustom !== undefined,
  "Informe uma doença do catálogo ou um nome customizado.",
);

export type TesteDoencaInput = z.infer<typeof testeDoencaSchema>;

export const registroSaudeSchema = z.discriminatedUnion("tipoRegistro", [
  vacinaRegistroSchema,
  parasitaRegistroSchema,
  testeDoencaSchema,
]);

export type RegistroSaudeInput = z.infer<typeof registroSaudeSchema>;
