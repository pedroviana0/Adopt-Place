import { z } from "zod";
import { idSchema } from "./common";

export const toggleFavoriteSchema = z.object({
  animalId: idSchema,
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
