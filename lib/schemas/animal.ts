import { Porte, Sexo, StatusAnimal } from "@prisma/client";
import { z } from "zod";

import {
  idSchema,
  optionalTextSchema,
  requiredTextSchema,
} from "@/lib/schemas/common";

export const animalStatusSchema = z.nativeEnum(StatusAnimal, {
  required_error: "Campo obrigatorio.",
});

export const animalInputSchema = z
  .object({
    nome: requiredTextSchema.max(80, "O nome deve ter no máximo 80 caracteres."),
    especieId: idSchema,
    racaId: idSchema.optional().nullable(),
    porte: z.nativeEnum(Porte, { required_error: "Campo obrigatorio." }),
    sexo: z.nativeEnum(Sexo, { required_error: "Campo obrigatorio." }),
    cor: requiredTextSchema.max(80, "A cor deve ter no máximo 80 caracteres."),
    idadeEstimada: optionalTextSchema.pipe(z.string().max(50, "A idade estimada deve ter no máximo 50 caracteres.").optional()),
    castrado: z.boolean().default(false),
    descricao: optionalTextSchema.pipe(z.string().max(2000, "A descrição deve ter no máximo 2.000 caracteres.").optional()),
    status: animalStatusSchema,
  })
  .strict("Revise os campos informados");

export const animalSchema = animalInputSchema;
export type AnimalInput = z.infer<typeof animalInputSchema>;
