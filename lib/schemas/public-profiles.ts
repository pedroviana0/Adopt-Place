import { Porte, Sexo } from "@prisma/client";
import { z } from "zod";

type SearchParamValue = string | string[] | undefined;

const firstValue = (value: SearchParamValue) =>
  Array.isArray(value) ? value[0] : value;

const optionalCuid = z.preprocess(
  (value) => {
    const current = firstValue(value as SearchParamValue);
    return typeof current === "string" && current.trim()
      ? current.trim()
      : undefined;
  },
  z.string().cuid().optional(),
);

export const publicProfileIdSchema = z.string().cuid();

export const publicProfileCatalogFilterSchema = z
  .object({
    especieId: optionalCuid,
    racaId: optionalCuid,
    porte: z.preprocess(
      (value) => firstValue(value as SearchParamValue) || undefined,
      z.nativeEnum(Porte).optional(),
    ),
    sexo: z.preprocess(
      (value) => firstValue(value as SearchParamValue) || undefined,
      z.nativeEnum(Sexo).optional(),
    ),
    page: z.preprocess(
      (value) => firstValue(value as SearchParamValue) || "1",
      z.coerce.number().int().min(1).default(1),
    ),
  })
  .strict();

export type PublicProfileCatalogFilters = z.infer<
  typeof publicProfileCatalogFilterSchema
>;

export type PublicProfileSearchParams = Record<
  string,
  string | string[] | undefined
>;
