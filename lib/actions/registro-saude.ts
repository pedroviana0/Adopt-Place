"use server"
import type { RegistroSaudeInput } from "@/lib/schemas/registro-saude"

export async function createRegistroSaude(
  animalId: string,
  data: RegistroSaudeInput
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T066 — pending implementation")
}

export async function updateRegistroSaude(
  id: string,
  data: RegistroSaudeInput
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T066 — pending implementation")
}

export async function deleteRegistroSaude(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T066 — pending implementation")
}