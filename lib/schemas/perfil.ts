import { z } from "zod";

import {
  cpfSchema,
  emailSchema,
  passwordSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";
import { cepSchema, municipioIdSchema } from "@/lib/schemas/localizacao";

const phoneSchema = requiredTextSchema.min(8, "Informe um telefone valido.");
const capacitySchema = z.number().int().nonnegative();
const descriptionSchema = z
  .string()
  .trim()
  .max(500, "A descricao deve ter no maximo 500 caracteres.")
  .transform((value) => value || null)
  .nullable()
  .optional();

/**
 * Cidade e UF sairam da entrada: agora sao derivadas do CEP pelo servidor. O
 * que chega do navegador e o CEP e, so quando o provedor esta fora do ar, o
 * municipio escolhido na lista.
 */
const localizacaoDeEntrada = {
  cep: cepSchema,
  municipioId: municipioIdSchema.optional(),
};

export const organizationRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  razaoSocial: requiredTextSchema.min(3, "Informe a razao social."),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Informe um CNPJ valido."),
  telefone: phoneSchema,
  endereco: requiredTextSchema,
  ...localizacaoDeEntrada,
  responsavelNome: requiredTextSchema.min(3, "Informe o responsavel."),
  capacidadeMaxima: capacitySchema.optional(),
}).strict();

export const fosterRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nomeCompleto: requiredTextSchema.min(3, "Informe o nome completo."),
  cpf: cpfSchema.transform((value) => value.replace(/\D/g, "")),
  telefone: phoneSchema,
  endereco: requiredTextSchema,
  ...localizacaoDeEntrada,
}).strict();

const nonEmptyPatch = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");

export const adopterProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    nomeCompleto: requiredTextSchema.min(3).optional(),
    telefone: phoneSchema.optional(),
    instagram: z.string().trim().max(120).nullable().optional(),
    endereco: requiredTextSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
  }),
);

export const organizationProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    razaoSocial: requiredTextSchema.min(3).optional(),
    descricao: descriptionSchema,
    telefone: phoneSchema.optional(),
    endereco: requiredTextSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
    responsavelNome: requiredTextSchema.min(3).optional(),
    capacidadeMaxima: capacitySchema.nullable().optional(),
  }),
);

export const fosterProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    nomeCompleto: requiredTextSchema.min(3).optional(),
    descricao: descriptionSchema,
    telefone: phoneSchema.optional(),
    endereco: requiredTextSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
    capacidadeAtual: capacitySchema.optional(),
  }),
);

export type OrganizationRegistrationInput = z.infer<
  typeof organizationRegistrationSchema
>;
export type FosterRegistrationInput = z.infer<typeof fosterRegistrationSchema>;
