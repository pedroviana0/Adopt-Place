import {
  Porte,
  Sexo,
  StatusAnimal,
  StatusSolicitacao,
} from "@prisma/client";
import { z } from "zod";

import { agendaFilterSchema } from "./cuidado-planejado";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function optionalEnumParam<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => firstValue(value) || undefined, schema.optional());
}

export const ownerRequestFilterSchema = z
  .object({
    status: optionalEnumParam(z.nativeEnum(StatusSolicitacao)),
  })
  .strict();

export const ownedAnimalFilterSchema = z
  .object({
    q: z.preprocess(
      (value) => firstValue(value) || undefined,
      z.string().trim().max(100).optional(),
    ),
    status: optionalEnumParam(z.nativeEnum(StatusAnimal)),
    especieId: z.preprocess(
      (value) => firstValue(value) || undefined,
      z.string().cuid().optional(),
    ),
    racaId: z.preprocess(
      (value) => firstValue(value) || undefined,
      z.string().cuid().optional(),
    ),
    porte: optionalEnumParam(z.nativeEnum(Porte)),
    sexo: optionalEnumParam(z.nativeEnum(Sexo)),
  })
  .strict();

export const healthAgendaFilterSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  const params = value as Record<string, SearchParamValue>;
  return {
    animalId: firstValue(params.animalId),
    tipo: firstValue(params.tipo),
    situacao: firstValue(params.situacao),
    from: firstValue(params.from),
    to: firstValue(params.to),
  };
}, agendaFilterSchema);

export const conversationFilterSchema = z.object({
  status: optionalEnumParam(z.enum(["ativas", "arquivadas", "todas"])),
});

export type OwnerRequestFilters = z.infer<typeof ownerRequestFilterSchema>;
export type OwnedAnimalFilters = z.infer<typeof ownedAnimalFilterSchema>;
export type HealthAgendaFilters = z.infer<typeof healthAgendaFilterSchema>;
export type ConversationFilters = z.infer<typeof conversationFilterSchema>;
