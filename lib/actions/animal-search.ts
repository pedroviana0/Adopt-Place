"use server";

import { getResponsibleContext } from "@/lib/api/responsible-context";
import { getOwnedAnimals, toOwnedAnimalDTO } from "@/lib/queries/owned-animals";
import { ownedAnimalFilterSchema } from "@/lib/schemas/dashboard-filters";

export async function searchAnimalsByName(term: string) {
  const contextResult = await getResponsibleContext();
  if ("error" in contextResult) {
    return [];
  }

  const filters = ownedAnimalFilterSchema.safeParse({ q: term });
  if (!filters.success) {
    return [];
  }
  const animals = await getOwnedAnimals(
    contextResult.context.responsavelId,
    contextResult.context.tipoPerfil,
    filters.data,
  );

  return animals.slice(0, 5).map(toOwnedAnimalDTO);
}
