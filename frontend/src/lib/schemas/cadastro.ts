import { z } from "zod";
import { addressSchema, cnpjSchema, cpfSchema, emailSchema, passwordSchema, personNameSchema, phoneSchema } from "./common";

const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{8}$/, "Informe um CEP com 8 dígitos"));

export const cadastroAdotanteSchema = z.object({
  email: emailSchema,
  senha: passwordSchema,
  nomeCompleto: personNameSchema,
  cpf: cpfSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  // Cidade e UF vêm do CEP, resolvidas pelo servidor.
  cep: cepSchema,
  municipioId: z.string().optional(),
  instagram: z.string().trim().max(120, "O Instagram deve ter no máximo 120 caracteres.").optional().or(z.literal("")),
});
export type CadastroAdotanteInput = z.infer<typeof cadastroAdotanteSchema>;

export const cadastroOrganizacaoSchema = z.object({
  email: emailSchema,
  senha: passwordSchema,
  razaoSocial: z.string().trim().min(3, "Informe a razão social.").max(160, "A razão social deve ter no máximo 160 caracteres."),
  cnpj: cnpjSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cep: cepSchema,
  municipioId: z.string().optional(),
  responsavelNome: personNameSchema,
  capacidadeMaxima: z.number().finite().int("Informe um número inteiro.").min(0).max(10000, "Informe no máximo 10.000.").optional(),
});
export type CadastroOrganizacaoInput = z.infer<typeof cadastroOrganizacaoSchema>;

export const cadastroAcolhedorSchema = z.object({
  email: emailSchema,
  senha: passwordSchema,
  nomeCompleto: personNameSchema,
  cpf: cpfSchema,
  telefone: phoneSchema,
  endereco: addressSchema,
  cep: cepSchema,
  municipioId: z.string().optional(),
});
export type CadastroAcolhedorInput = z.infer<typeof cadastroAcolhedorSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, "Informe a senha.").max(128, "A senha deve ter no máximo 128 caracteres."),
});
export type LoginInput = z.infer<typeof loginSchema>;
