import { z } from "zod";

import { idSchema, optionalTextSchema, requiredTextSchema } from "@/lib/schemas/common";

export const animalSchema = z
  .object({
    nome: requiredTextSchema,
    especieId: idSchema,
    racaId: idSchema.optional().nullable(),
    porte: z.enum(["P", "M", "G"], { required_error: "Campo obrigatorio." }),
    sexo: z.enum(["M", "F"], { required_error: "Campo obrigatorio." }),
    cor: requiredTextSchema,
    idadeEstimada: optionalTextSchema,
    castrado: z.boolean().default(false),
    descricao: optionalTextSchema,
    status: z.enum(
      ["RESGATADO", "EM_CUIDADOS", "DISPONIVEL", "EM_PROCESSO_ADOCAO", "ADOTADO"],
      { required_error: "Campo obrigatorio." },
    ),
    organizacaoId: idSchema.optional().nullable(),
    acolhedorId: idSchema.optional().nullable(),
  })
  .refine(
    (data) => Boolean(data.organizacaoId) !== Boolean(data.acolhedorId),
    "Animal deve pertencer a exatamente um responsável (organização ou acolhedor)",
  );

export const animalInputSchema = animalSchema;

export type AnimalInput = z.infer<typeof animalInputSchema>;
