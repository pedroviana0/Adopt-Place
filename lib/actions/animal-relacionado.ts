"use server";

import { AnimalRelacionadoInput } from "@/lib/schemas/animal-relacionado";

export async function linkAnimals(
  data: AnimalRelacionadoInput
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T067 — pending implementation");
}

export async function unlinkAnimals(
  animalId: string,
  animalRelacionadoId: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T067 — pending implementation");
}
