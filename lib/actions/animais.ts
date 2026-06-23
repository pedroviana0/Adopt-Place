"use server";

import { StatusAnimal } from "@prisma/client";
import { AnimalInput } from "@/lib/schemas/animal";

export async function createAnimal(
  data: AnimalInput
): Promise<{ id?: string; error?: string }> {
  throw new Error("[STUB] T063 — pending implementation");
}

export async function updateAnimal(
  id: string,
  data: Partial<AnimalInput>
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T063 — pending implementation");
}

export async function updateAnimalStatus(
  id: string,
  status: StatusAnimal
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T063 — pending implementation");
}

export async function deleteAnimal(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T063 — pending implementation");
}
