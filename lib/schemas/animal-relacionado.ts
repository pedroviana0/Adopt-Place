import { z } from "zod";
import { idSchema } from "./common";

export const animalRelacionadoSchema = z
  .object({
    animalId: idSchema,
    animalRelacionadoId: idSchema,
  })
  .refine(
    (data) => data.animalId !== data.animalRelacionadoId,
    "Um animal não pode ser relacionado a si mesmo.",
  );

export type AnimalRelacionadoInput = z.infer<typeof animalRelacionadoSchema>;
