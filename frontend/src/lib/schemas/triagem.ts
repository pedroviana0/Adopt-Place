import { z } from "zod";
import { TipoMoradia } from "../domain/enums";

const requiredText = (label: string, max = 500) => z.string().trim()
  .min(1, `${label} é obrigatório.`).max(max, `Use no máximo ${max} caracteres.`);
const optionalText = z.string().trim().max(500, "Use no máximo 500 caracteres.").optional();

export const triagemSchema = z.object({
  motivoAdocao: requiredText("O motivo da adoção").min(10, "Descreva o motivo da adoção com pelo menos 10 caracteres."),
  tipoAnimalDesejado: requiredText("O tipo de animal desejado", 120),
  podeArcarCustosVet: z.boolean(),
  adocaoParaPresente: z.boolean(),
  adocaoParaPresenteDetalhe: optionalText,
  tipoMoradia: z.enum([TipoMoradia.CASA, TipoMoradia.APARTAMENTO, TipoMoradia.SITIO_FAZENDA]),
  moradiaPropria: z.boolean(),
  numAdultosCasa: z.number({ invalid_type_error: "Informe a quantidade de adultos." }).int("Informe um número inteiro.").min(1, "Informe ao menos 1 adulto.").max(30, "Informe no máximo 30 adultos."),
  temCriancas: z.boolean(),
  criancasFaixaEtaria: optionalText,
  todosConcordamAdocao: z.boolean(),
  condominioPermiteAnimal: optionalText,
  janelasTeladas: z.boolean(),
  acessoRua: requiredText("A informação sobre acesso à rua"),
  murosSeguros: z.boolean(),
  horasSozinho: requiredText("A informação sobre tempo sozinho"),
  responsavelViagem: requiredText("O responsável em viagens"),
  planoEmGravidez: optionalText,
  alergicosNaCasa: z.boolean(),
  alergicosNaCasaDetalhe: optionalText,
  planoMudanca: requiredText("O plano em caso de mudança"),
  // Required by the backend contract (adopterScreeningSchema requiredTextSchema).
  historicoDevolucao: requiredText("O histórico de devolução"),
  historicoPercaDescuido: requiredText("O histórico de perda ou descuido"),
  cienteLongevidade: z.boolean(),
  permiteVisitaProtetor: z.boolean(),
  cienteNaoRepassar: z.boolean(),
  teveAnimaisAntes: z.boolean(),
  animaisAnterioresDescricao: optionalText,
  temOutrosAnimais: z.boolean(),
  outrosAnimaisDescricao: optionalText,
}).superRefine((data, ctx) => {
  const required = (condition: boolean, key: keyof typeof data, message: string) => {
    if (condition && !data[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
  };
  required(data.adocaoParaPresente, "adocaoParaPresenteDetalhe", "Explique para quem será o presente.");
  required(data.temCriancas, "criancasFaixaEtaria", "Informe a faixa etária das crianças.");
  required(data.alergicosNaCasa, "alergicosNaCasaDetalhe", "Explique quem possui alergia e como será cuidado.");
  required(data.teveAnimaisAntes, "animaisAnterioresDescricao", "Conte brevemente sobre os animais anteriores.");
  required(data.temOutrosAnimais, "outrosAnimaisDescricao", "Descreva os outros animais da casa.");
});
export type TriagemInput = z.infer<typeof triagemSchema>;
