import { z } from "zod";

export const requestDecisionSchema = z.object({
  decision: z.enum(["APROVADA", "RECUSADA"]),
  observacoes: z.string().max(1000, "Máximo de 1000 caracteres.").optional(),
}).strict();

export type RequestDecisionInput = z.infer<typeof requestDecisionSchema>;
