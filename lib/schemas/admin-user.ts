import { z } from "zod";

import { idSchema } from "./common";

export const setUserActiveSchema = z.object({
  userId: idSchema,
  ativo: z.boolean(),
}).strict();

export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
