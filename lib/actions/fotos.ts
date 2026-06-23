"use server"
import type { PhotoOrderInput } from "@/lib/schemas/foto-animal"

export async function updatePhotoOrder(
  photos: PhotoOrderInput
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T065 — pending implementation")
}

export async function setPrimaryPhoto(
  fotoId: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T065 — pending implementation")
}