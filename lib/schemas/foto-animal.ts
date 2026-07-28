import { z } from "zod";

import { idSchema } from "@/lib/schemas/common";

export const photoSchema = z
  .object({
    url: z.string().url("Informe uma URL valida."),
    principal: z.boolean(),
  })
  .strict();

export type PhotoInput = z.infer<typeof photoSchema>;

export const photoOrderItemSchema = z
  .object({
    id: idSchema,
    ordem: z.number().int().min(0),
  })
  .strict();

export type PhotoOrderItemInput = z.infer<typeof photoOrderItemSchema>;

export const photoOrderSchema = z
  .array(photoOrderItemSchema)
  .min(1, "Informe ao menos uma foto.")
  .max(10, "Maximo de 10 fotos permitidas.");

export type PhotoOrderInput = z.infer<typeof photoOrderSchema>;

export const deletePhotoSchema = z
  .object({
    novaPrincipalId: idSchema.optional(),
  })
  .strict();

export type DeletePhotoInput = z.infer<typeof deletePhotoSchema>;
