import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 2000;

export const mensagemSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Mensagem nao pode ser vazia.")
    .max(
      MAX_MESSAGE_LENGTH,
      "Mensagem deve ter no maximo 2000 caracteres.",
    ),
});

export type MensagemInput = z.infer<typeof mensagemSchema>;
