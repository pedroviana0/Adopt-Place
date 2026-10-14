import { z } from "zod";
import { ResultadoTeste, TipoRegistroSaude } from "../domain/enums";

const base = {
  dataRegistro: z.string().min(1, "Data obrigatória"),
  dataProxima: z.string().optional().nullable(),
  responsavelRegistro: z.string().min(1, "Informe o responsável pelo registro"),
};

export const registroSaudeSchema = z
  .discriminatedUnion("tipo", [
    z.object({
      tipo: z.literal(TipoRegistroSaude.VACINA),
      nomeVacina: z.string().min(1, "Nome da vacina obrigatório"),
      ehVacinaCustomizada: z.boolean(),
      ...base,
    }),
    z.object({
      tipo: z.literal(TipoRegistroSaude.CONTROLE_PARASITAS),
      tipoMedicamento: z.string().min(1, "Tipo de medicamento obrigatório"),
      frequencia: z.string().optional().nullable(),
      ...base,
    }),
    z.object({
      tipo: z.literal(TipoRegistroSaude.TESTE_DOENCA),
      nomeDoenca: z.string().min(1, "Nome da doença obrigatório"),
      ehDoencaCustomizada: z.boolean(),
      resultado: z.enum([ResultadoTeste.POSITIVO, ResultadoTeste.NEGATIVO], {
        message: "Resultado obrigatório (positivo ou negativo)",
      }),
      ...base,
    }),
    // Spec 009 (RF-008): a proxima dose gera o cuidado pendente que marca o
    // animal como "em tratamento". O responsavel e preenchido pelo backend.
    z.object({
      tipo: z.literal(TipoRegistroSaude.MEDICAMENTO_TRATAMENTO),
      medicamentoTratamento: z
        .string()
        .trim()
        .min(1, "Informe o medicamento ou tratamento")
        .max(160, "Use no máximo 160 caracteres."),
      dataRegistro: base.dataRegistro,
      dataProxima: base.dataProxima,
    }),
  ])
  .refine(
    (v) => {
      const d = new Date(v.dataRegistro);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      return d.getTime() <= hoje.getTime();
    },
    { message: "Data de aplicação não pode ser futura", path: ["dataRegistro"] }
  )
  .refine(
    (v) => {
      if (!v.dataProxima) return true;
      return new Date(v.dataProxima).getTime() > new Date(v.dataRegistro).getTime();
    },
    { message: "Data próxima deve ser posterior ao registro", path: ["dataProxima"] }
  );

export type RegistroSaudeInput = z.infer<typeof registroSaudeSchema>;
