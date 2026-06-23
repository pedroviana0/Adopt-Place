import { Porte, Sexo } from "@prisma/client";
import { z } from "zod";

import { idSchema, optionalTextSchema, requiredTextSchema } from "@/lib/schemas/common";

export const animalInputSchema = z.object({
  nome: requiredTextSchema,
  especieId: idSchema,
  racaId: idSchema.optional().nullable(),
  porte: z.nativeEnum(Porte, { required_error: "Campo obrigatorio." }),
  sexo: z.nativeEnum(Sexo, { required_error: "Campo obrigatorio." }),
  cor: requiredTextSchema,
  idadeEstimada: optionalTextSchema,
  castrado: z.boolean().default(false),
  descricao: optionalTextSchema,
});

export type AnimalInput = z.infer<typeof animalInputSchema>;
