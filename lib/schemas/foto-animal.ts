import { z } from "zod";
import { idSchema } from "./common";

export const photoSchema = z.object({
  url: z.string().url("Informe uma URL válida."),
  principal: z.boolean(),
});

export type PhotoInput = z.infer<typeof photoSchema>;

export const photoOrderItemSchema = z.object({
  id: idSchema,
  order: z.number().int().min(0),
});

export type PhotoOrderItemInput = z.infer<typeof photoOrderItemSchema>;

export const photoOrderSchema = z
  .array(photoOrderItemSchema)
  .max(10, "Máximo de 10 fotos permitidas.");

export type PhotoOrderInput = z.infer<typeof photoOrderSchema>;
