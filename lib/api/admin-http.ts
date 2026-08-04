import { TipoPerfil } from "@prisma/client";
import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ADMIN-01 (Issue #60): shared auth boundary for the admin user contracts.
// The admin list query carries no guard of its own, so the route MUST enforce an
// active ADMIN before any read or write.
export function adminApiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function requireActiveAdmin(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { response: adminApiError(401, "UNAUTHENTICATED", "Nao autenticado") };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { ativo: true, tipoPerfil: true },
  });
  if (!user?.ativo) {
    return { response: adminApiError(403, "INACTIVE_ACCOUNT", "Conta desativada") };
  }
  if (user.tipoPerfil !== TipoPerfil.ADMIN) {
    return { response: adminApiError(403, "FORBIDDEN", "Acesso negado") };
  }

  return { userId: session.user.id };
}
