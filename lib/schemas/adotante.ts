import { TipoMoradia } from "@prisma/client";
import { z } from "zod";

import {
  cpfSchema,
  emailSchema,
  optionalTextSchema,
  passwordSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";

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
  nomeCompleto: requiredTextSchema.min(3, "Informe o nome completo."),
  cpf: cpfSchema.transform((value) => value.replace(/\D/g, "")),
  email: emailSchema,
  telefone: requiredTextSchema.min(8, "Informe um telefone valido."),
  instagram: optionalTextSchema,
  endereco: requiredTextSchema,
  cidade: requiredTextSchema,
  estado: requiredTextSchema.length(2, "Use a UF com 2 letras.").transform((value) => value.toUpperCase()),
  password: passwordSchema,
});

export const adopterScreeningSchema = z.object({
  motivoAdocao: requiredTextSchema,
  tipoAnimalDesejado: requiredTextSchema,
  podeArcarCustosVet: booleanSelectSchema,
  adocaoParaPresente: booleanSelectSchema,
  adocaoParaPresenteDetalhe: optionalTextSchema,
  tipoMoradia: z.nativeEnum(TipoMoradia, { required_error: "Campo obrigatorio." }),
  moradiaPropria: booleanSelectSchema,
  numAdultosCasa: z.coerce.number().int().min(1, "Informe ao menos 1 adulto."),
  temCriancas: booleanSelectSchema,
  criancasFaixaEtaria: optionalTextSchema,
  todosConordamAdocao: booleanSelectSchema,
  condominioPermiteAnimal: optionalTextSchema,
  janelasTeladas: optionalBooleanSelectSchema,
  acessoRua: requiredTextSchema,
  murosSeguros: optionalBooleanSelectSchema,
  horasSozinho: requiredTextSchema,
  responsavelViagem: requiredTextSchema,
  planoEmGravidez: optionalTextSchema,
  alergicosNaCasa: booleanSelectSchema,
  alergicosNaCasaDetalhe: optionalTextSchema,
  planoMudanca: requiredTextSchema,
  historicoDevolucao: requiredTextSchema,
  historicoPercaDescuido: requiredTextSchema,
  cienteLongevidade: booleanSelectSchema,
  permiteVisitaProtetor: booleanSelectSchema,
  ciendeNaoRepassar: booleanSelectSchema,
  teveAnimaisAntes: booleanSelectSchema,
  animaisAnterioresDescricao: optionalTextSchema,
  temOutrosAnimais: booleanSelectSchema,
  outrosAnimaisDescricao: optionalTextSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
  callbackUrl: z.string().optional(),
});

export type AdopterRegistrationInput = z.infer<typeof adopterRegistrationSchema>;
export type AdopterScreeningInput = z.infer<typeof adopterScreeningSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
