"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export class RequestGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestGuardError";
  }
}

export async function requireCompletedScreening(
  adotanteId: string,
  returnTo?: string,
): Promise<void> {
  const adotante = await prisma.adotante.findUnique({
    where: { id: adotanteId },
    select: { triagemConcluida: true },
  });

  if (!adotante) {
    throw new RequestGuardError("Perfil de adotante nao encontrado.");
  }

  if (!adotante.triagemConcluida) {
    const callbackUrl = returnTo ? `?callbackUrl=${encodeURIComponent(returnTo)}` : "";
    redirect(`/dashboard/triagem${callbackUrl}`);
  }
}
