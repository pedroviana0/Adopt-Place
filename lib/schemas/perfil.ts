import { z } from "zod";

import {
  cpfSchema,
  emailSchema,
  passwordSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";

const stateSchema = requiredTextSchema
  .length(2, "Use a UF com 2 letras.")
  .transform((value) => value.toUpperCase());

const phoneSchema = requiredTextSchema.min(8, "Informe um telefone valido.");
const capacitySchema = z.number().int().nonnegative();

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
  cidade: requiredTextSchema,
  estado: stateSchema,
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
  cidade: requiredTextSchema,
  estado: stateSchema,
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
    cidade: requiredTextSchema.optional(),
    estado: stateSchema.optional(),
  }),
);

export const organizationProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    razaoSocial: requiredTextSchema.min(3).optional(),
    telefone: phoneSchema.optional(),
    endereco: requiredTextSchema.optional(),
    cidade: requiredTextSchema.optional(),
    estado: stateSchema.optional(),
    responsavelNome: requiredTextSchema.min(3).optional(),
    capacidadeMaxima: capacitySchema.nullable().optional(),
  }),
);

export const fosterProfileUpdateSchema = nonEmptyPatch(
  z.object({
    email: emailSchema.optional(),
    nomeCompleto: requiredTextSchema.min(3).optional(),
    telefone: phoneSchema.optional(),
    endereco: requiredTextSchema.optional(),
    cidade: requiredTextSchema.optional(),
    estado: stateSchema.optional(),
    capacidadeAtual: capacitySchema.optional(),
  }),
);

export type OrganizationRegistrationInput = z.infer<
  typeof organizationRegistrationSchema
>;
export type FosterRegistrationInput = z.infer<typeof fosterRegistrationSchema>;
