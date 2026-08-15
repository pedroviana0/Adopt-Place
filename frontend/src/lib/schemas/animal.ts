import { z } from "zod";
import { Porte, Sexo, StatusAnimal } from "../domain/enums";

export const animalSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do animal.").max(80, "O nome deve ter no máximo 80 caracteres."),
  especieId: z.string().min(1, "Selecione a espécie."),
  racaId: z.string().optional().nullable(),
  porte: z.enum([Porte.P, Porte.M, Porte.G], { errorMap: () => ({ message: "Selecione o porte." }) }),
  sexo: z.enum([Sexo.M, Sexo.F], { errorMap: () => ({ message: "Selecione o sexo." }) }),
  cor: z.string().trim().min(1, "Informe a cor do animal.").max(80, "A cor deve ter no máximo 80 caracteres."),
  idadeEstimada: z.string().trim().max(50, "A idade estimada deve ter no máximo 50 caracteres.").optional().nullable(),
  castrado: z.boolean(),
  descricao: z.string().trim().max(2000, "A descrição deve ter no máximo 2.000 caracteres.").optional().nullable(),
  status: z.enum([
    StatusAnimal.RESGATADO,
    StatusAnimal.EM_CUIDADOS,
    StatusAnimal.DISPONIVEL,
    StatusAnimal.EM_PROCESSO_ADOCAO,
    StatusAnimal.ADOTADO,
  ]),
});
export type AnimalInput = z.infer<typeof animalSchema>;
