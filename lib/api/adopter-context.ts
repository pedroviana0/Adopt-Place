import { TipoPerfil } from "@prisma/client";
import { NextResponse } from "next/server";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function apiError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

export async function requireActiveAdopter(): Promise<
  { adotanteId: string } | { response: NextResponse }
> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return {
      response: apiError(
        401,
        "UNAUTHENTICATED",
        "Autenticacao necessaria.",
      ),
    };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      ativo: true,
      tipoPerfil: true,
      adotante: { select: { id: true } },
    },
  });

  if (!user?.ativo) {
    return {
      response: apiError(
        403,
        "INACTIVE_ACCOUNT",
        INACTIVE_ACCOUNT_MESSAGE,
      ),
    };
  }

  if (user.tipoPerfil !== TipoPerfil.ADOTANTE || !user.adotante) {
    return {
      response: apiError(
        403,
        "ADOPTER_ONLY",
        "Acesso exclusivo para adotantes.",
      ),
    };
  }

  return { adotanteId: user.adotante.id };
}
