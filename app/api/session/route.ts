import { NextResponse } from "next/server";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const unauthenticatedError = {
  error: {
    code: "UNAUTHENTICATED",
    message: "Autenticacao necessaria.",
  },
};

const inactiveAccountError = {
  error: {
    code: "INACTIVE_ACCOUNT",
    message: INACTIVE_ACCOUNT_MESSAGE,
  },
};

export async function GET() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json(unauthenticatedError, { status: 401 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      tipoPerfil: true,
      ativo: true,
      adotante: { select: { id: true } },
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });

  if (!usuario?.ativo) {
    return NextResponse.json(inactiveAccountError, { status: 403 });
  }

  return NextResponse.json({
    user: {
      id: usuario.id,
      email: usuario.email,
      tipoPerfil: usuario.tipoPerfil,
      ativo: usuario.ativo,
      adotanteId: usuario.adotante?.id ?? null,
      organizacaoId: usuario.organizacao?.id ?? null,
      acolhedorId: usuario.acolhedor?.id ?? null,
    },
    expires: session.expires,
  });
}
