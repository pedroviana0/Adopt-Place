import { z } from "zod";
import { idSchema } from "./common";

export const adoptionRequestSchema = z.object({
  animalId: idSchema,
});

export type AdoptionRequestInput = z.infer<typeof adoptionRequestSchema>;
