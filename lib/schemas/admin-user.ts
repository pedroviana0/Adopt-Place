import { z } from "zod";

import { idSchema } from "./common";

export const setUserActiveSchema = z.object({
  userId: idSchema,
  ativo: z.boolean(),
});

export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
