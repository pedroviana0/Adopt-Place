import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2000;

export const mensagemSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "A mensagem não pode ser vazia.")
    .max(
      MAX_MESSAGE_LENGTH,
      "A mensagem deve ter no máximo 2.000 caracteres.",
    ),
}).strict();

export type MensagemInput = z.infer<typeof mensagemSchema>;
