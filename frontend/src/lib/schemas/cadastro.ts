import { z } from "zod";

export const cadastroAdotanteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF deve ter 11 dígitos (apenas números)"),
  telefone: z.string().min(8, "Telefone inválido"),
  endereco: z.string().min(3, "Endereço inválido"),
  cidade: z.string().min(2, "Cidade inválida"),
  estado: z.string().length(2, "UF deve ter 2 letras"),
  instagram: z.string().optional().or(z.literal("")),
});
export type CadastroAdotanteInput = z.infer<typeof cadastroAdotanteSchema>;

export const cadastroOrganizacaoSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  razaoSocial: z.string().min(3),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos"),
  telefone: z.string().min(8),
  endereco: z.string().min(3),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  responsavelNome: z.string().min(3),
  capacidadeMaxima: z.number().int().positive().optional(),
});
export type CadastroOrganizacaoInput = z.infer<typeof cadastroOrganizacaoSchema>;

export const cadastroAcolhedorSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  nomeCompleto: z.string().min(3),
  cpf: z.string().regex(/^\d{11}$/),
  telefone: z.string().min(8),
  endereco: z.string().min(3),
  cidade: z.string().min(2),
  estado: z.string().length(2),
});
export type CadastroAcolhedorInput = z.infer<typeof cadastroAcolhedorSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
