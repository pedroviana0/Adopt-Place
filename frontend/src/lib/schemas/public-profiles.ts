import { z } from "zod";

const optionalId = z.string().trim().cuid().optional();

export const profileCatalogFilterSchema = z
  .object({
    especieId: optionalId,
    racaId: optionalId,
    porte: z.enum(["P", "M", "G"]).optional(),
    sexo: z.enum(["M", "F"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .strict();

export type ProfileCatalogFilters = z.infer<
  typeof profileCatalogFilterSchema
>;

export const EMPTY_PROFILE_CATALOG_FILTERS: ProfileCatalogFilters = {
  page: 1,
};
