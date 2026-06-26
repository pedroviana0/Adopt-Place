"use server";

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
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
  const session = await getServerSession();

  if (!session?.user?.id) {
    throw new RequestGuardError("Nao autenticado.");
  }

  if (!session.user.ativo) {
    throw new RequestGuardError("Conta desativada.");
  }

  if (session.user.tipoPerfil !== "ADOTANTE" || session.user.adotanteId !== adotanteId) {
    throw new RequestGuardError("Acesso negado.");
  }

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
