import { z } from "zod";

import {
  addressSchema,
  cnpjSchema,
  cpfSchema,
  emailSchema,
  passwordSchema,
  personNameSchema,
  phoneSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";
import { cepSchema, municipioIdSchema } from "@/lib/schemas/localizacao";

const capacitySchema = z.number().finite().int("Informe um número inteiro.").min(0).max(10000, "Informe no máximo 10.000.");
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
  razaoSocial: requiredTextSchema.min(3, "Informe a razão social.").max(160, "A razão social deve ter no máximo 160 caracteres."),
  cnpj: cnpjSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  ...localizacaoDeEntrada,
  responsavelNome: personNameSchema,
  capacidadeMaxima: capacitySchema.optional(),
}).strict();

export const fosterRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nomeCompleto: personNameSchema,
  cpf: cpfSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  ...localizacaoDeEntrada,
}).strict();

const nonEmptyPatch = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo.");

export const adopterProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    nomeCompleto: personNameSchema.optional(),
    telefone: phoneSchema.optional(),
    instagram: z.string().trim().max(120).nullable().optional(),
    endereco: addressSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
  }),
);

export const organizationProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    razaoSocial: requiredTextSchema.min(3).max(160).optional(),
    descricao: descriptionSchema,
    telefone: phoneSchema.optional(),
    endereco: addressSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
    responsavelNome: personNameSchema.optional(),
    capacidadeMaxima: capacitySchema.nullable().optional(),
  }),
);

export const fosterProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    nomeCompleto: personNameSchema.optional(),
    descricao: descriptionSchema,
    telefone: phoneSchema.optional(),
    endereco: addressSchema.optional(),
    cep: cepSchema.optional(),
    municipioId: municipioIdSchema.optional(),
    capacidadeAtual: capacitySchema.optional(),
  }),
);

export type OrganizationRegistrationInput = z.infer<
  typeof organizationRegistrationSchema
>;
export type FosterRegistrationInput = z.infer<typeof fosterRegistrationSchema>;
