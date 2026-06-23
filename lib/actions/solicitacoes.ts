"use server";

import { RequestDecisionInput } from "@/lib/schemas/solicitacao-decisao";

export async function createAdoptionRequest(
  animalId: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T052 — pending implementation");
}

export async function decideAdoptionRequest(
  solicitacaoId: string,
  data: RequestDecisionInput
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T079 — pending implementation");
}

export async function completeAdoption(
  solicitacaoId: string
): Promise<{ success?: boolean; error?: string }> {
  throw new Error("[STUB] T085 — pending implementation");
}
