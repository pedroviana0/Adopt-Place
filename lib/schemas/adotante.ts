import { TipoMoradia } from "@prisma/client";
import { z } from "zod";

import {
  cpfSchema,
  addressSchema,
  emailSchema,
  optionalTextSchema,
  passwordSchema,
  personNameSchema,
  phoneSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";
import { cepSchema, municipioIdSchema } from "@/lib/schemas/localizacao";

const booleanSelectSchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean({ required_error: "Campo obrigatorio." }));

const optionalBooleanSelectSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

export const adopterRegistrationSchema = z.object({
  nomeCompleto: personNameSchema,
  cpf: cpfSchema,
  email: emailSchema,
  telefone: phoneSchema,
  instagram: z.string().trim().max(120, "O Instagram deve ter no máximo 120 caracteres.").optional(),
  endereco: addressSchema,
  // Cidade e UF sao derivadas do CEP pelo servidor, nao digitadas.
  cep: cepSchema,
  municipioId: municipioIdSchema.optional(),
  password: passwordSchema,
}).strict();

const screeningText = requiredTextSchema.max(500, "Use no máximo 500 caracteres.");
const screeningDetail = optionalTextSchema.pipe(z.string().max(500, "Use no máximo 500 caracteres.").optional());

export const adopterScreeningSchema = z.object({
  motivoAdocao: screeningText.min(10, "Descreva o motivo da adoção com pelo menos 10 caracteres."),
  tipoAnimalDesejado: requiredTextSchema.max(120, "Use no máximo 120 caracteres."),
  podeArcarCustosVet: booleanSelectSchema,
  adocaoParaPresente: booleanSelectSchema,
  adocaoParaPresenteDetalhe: screeningDetail,
  tipoMoradia: z.nativeEnum(TipoMoradia, { required_error: "Campo obrigatorio." }),
  moradiaPropria: booleanSelectSchema,
  numAdultosCasa: z.coerce.number().int("Informe um número inteiro.").min(1, "Informe ao menos 1 adulto.").max(30, "Informe no máximo 30 adultos."),
  temCriancas: booleanSelectSchema,
  criancasFaixaEtaria: screeningDetail,
  todosConordamAdocao: booleanSelectSchema,
  condominioPermiteAnimal: screeningDetail,
  janelasTeladas: optionalBooleanSelectSchema,
  acessoRua: screeningText,
  murosSeguros: optionalBooleanSelectSchema,
  horasSozinho: screeningText,
  responsavelViagem: screeningText,
  planoEmGravidez: screeningDetail,
  alergicosNaCasa: booleanSelectSchema,
  alergicosNaCasaDetalhe: screeningDetail,
  planoMudanca: screeningText,
  historicoDevolucao: screeningText,
  historicoPercaDescuido: screeningText,
  cienteLongevidade: booleanSelectSchema,
  permiteVisitaProtetor: booleanSelectSchema,
  ciendeNaoRepassar: booleanSelectSchema,
  teveAnimaisAntes: booleanSelectSchema,
  animaisAnterioresDescricao: screeningDetail,
  temOutrosAnimais: booleanSelectSchema,
  outrosAnimaisDescricao: screeningDetail,
}).strict().superRefine((data, ctx) => {
  const requireDetail = (condition: boolean, key: keyof typeof data, message: string) => {
    if (condition && !data[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
  };
  requireDetail(data.adocaoParaPresente, "adocaoParaPresenteDetalhe", "Explique para quem será o presente.");
  requireDetail(data.temCriancas, "criancasFaixaEtaria", "Informe a faixa etária das crianças.");
  requireDetail(data.alergicosNaCasa, "alergicosNaCasaDetalhe", "Explique quem possui alergia e como será cuidado.");
  requireDetail(data.teveAnimaisAntes, "animaisAnterioresDescricao", "Conte brevemente sobre os animais anteriores.");
  requireDetail(data.temOutrosAnimais, "outrosAnimaisDescricao", "Descreva os outros animais da casa.");
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
  callbackUrl: z.string().optional(),
});

export type AdopterRegistrationInput = z.infer<typeof adopterRegistrationSchema>;
export type AdopterScreeningInput = z.infer<typeof adopterScreeningSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
