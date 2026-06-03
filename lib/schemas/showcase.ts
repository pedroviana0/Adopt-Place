import { Porte, Sexo } from "@prisma/client";
import { z } from "zod";

type SearchParamValue = string | string[] | undefined;

const firstValue = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value);

const stringParam = z.preprocess(
  (value) => {
    const current = firstValue(value as SearchParamValue);
    return current && current.trim().length > 0 ? current.trim() : undefined;
  },
  z.string().optional(),
);

const arrayParam = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(",")).filter(Boolean);
  }

  if (typeof value === "string" && value.length > 0) {
    return value.split(",").filter(Boolean);
  }

  return [];
}, z.array(z.string()).default([]));

export const showcaseTagSchema = z.enum(["castrado", "vacinado", "vermifugado", "testado"]);

export const showcaseFilterSchema = z.object({
  especieId: stringParam,
  racaId: stringParam,
  porte: z.preprocess(
    (value) => firstValue(value as SearchParamValue) || undefined,
    z.nativeEnum(Porte).optional(),
  ),
  sexo: z.preprocess(
    (value) => firstValue(value as SearchParamValue) || undefined,
    z.nativeEnum(Sexo).optional(),
  ),
  cidade: stringParam,
  tags: arrayParam.pipe(z.array(showcaseTagSchema)),
  page: z.preprocess(
    (value) => firstValue(value as SearchParamValue) || "1",
    z.coerce.number().int().min(1).default(1),
  ),
});

export type ShowcaseFilters = z.infer<typeof showcaseFilterSchema>;

export type ShowcaseSearchParams = Record<string, string | string[] | undefined>;

export function parseShowcaseFilters(searchParams?: ShowcaseSearchParams): ShowcaseFilters {
  return showcaseFilterSchema.catch({
    especieId: undefined,
    racaId: undefined,
    porte: undefined,
    sexo: undefined,
    cidade: undefined,
    tags: [],
    page: 1,
  }).parse(searchParams ?? {});
}
