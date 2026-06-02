import { z } from "zod";

export const idSchema = z.string().cuid("Identificador invalido.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail valido.");

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no maximo 128 caracteres.");

export const cpfSchema = z
  .string()
  .trim()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "Informe um CPF valido.");

export const requiredTextSchema = z.string().trim().min(1, "Campo obrigatorio.");

export const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export const dateSchema = z.coerce.date({
  invalid_type_error: "Informe uma data valida.",
});

export const pastOrTodayDateSchema = dateSchema.refine(
  (date) => date <= new Date(),
  "A data nao pode ser futura.",
);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(12),
});

export const formStateSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  fieldErrors: z.record(z.array(z.string())).optional(),
});

export type FormState = z.infer<typeof formStateSchema>;
