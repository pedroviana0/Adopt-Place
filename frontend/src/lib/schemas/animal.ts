import { z } from "zod";
import { Porte, Sexo, StatusAnimal } from "../domain/enums";

export const animalSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  especieId: z.string().min(1, "Espécie obrigatória"),
  racaId: z.string().optional().nullable(),
  porte: z.enum([Porte.P, Porte.M, Porte.G]),
  sexo: z.enum([Sexo.M, Sexo.F]),
  cor: z.string().min(1, "Cor obrigatória"),
  idadeEstimada: z.string().optional().nullable(),
  castrado: z.boolean(),
  descricao: z.string().optional().nullable(),
  status: z.enum([
    StatusAnimal.RESGATADO,
    StatusAnimal.EM_CUIDADOS,
    StatusAnimal.DISPONIVEL,
    StatusAnimal.EM_PROCESSO_ADOCAO,
    StatusAnimal.ADOTADO,
  ]),
});
export type AnimalInput = z.infer<typeof animalSchema>;
