import { TipoPerfil } from "@prisma/client";
import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function chatApiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function requireActiveChatParticipant(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return {
      response: chatApiError(401, "UNAUTHENTICATED", "Nao autenticado"),
    };
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { ativo: true, tipoPerfil: true },
  });
  if (!user?.ativo) {
    return {
      response: chatApiError(403, "INACTIVE_ACCOUNT", "Conta desativada"),
    };
  }
  if (
    user.tipoPerfil !== TipoPerfil.ADOTANTE &&
    user.tipoPerfil !== TipoPerfil.ORGANIZACAO &&
    user.tipoPerfil !== TipoPerfil.ACOLHEDOR
  ) {
    return { response: chatApiError(403, "FORBIDDEN", "Acesso negado") };
  }

  return { userId: session.user.id };
}

export function chatActionError(error: string) {
  if (error === "Conversa arquivada") {
    return chatApiError(409, "CONVERSATION_ARCHIVED", error);
  }
  if (error === "Acesso negado") {
    return chatApiError(404, "NOT_FOUND", "Conversa nao encontrada");
  }
  return chatApiError(400, "INVALID_REQUEST", error);
}
