import { z } from "zod";

import { idSchema } from "@/lib/schemas/common";

export const animalRelacionadoSchema = z
  .object({
    animalId: idSchema,
    animalRelacionadoId: idSchema,
  })
  .strict()
  .refine(
    (data) => data.animalId !== data.animalRelacionadoId,
    "Um animal nao pode ser relacionado a si mesmo.",
  );

export type AnimalRelacionadoInput = z.infer<typeof animalRelacionadoSchema>;

export const relatedAnimalRequestSchema = z
  .object({
    animalRelacionadoId: idSchema,
  })
  .strict();
