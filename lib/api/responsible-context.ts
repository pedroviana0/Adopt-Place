import { TipoPerfil } from "@prisma/client";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ResponsibleRole =
  | typeof TipoPerfil.ORGANIZACAO
  | typeof TipoPerfil.ACOLHEDOR;

export type ResponsibleContext = {
  userId: string;
  tipoPerfil: ResponsibleRole;
  responsavelId: string;
  organizacaoId: string | null;
  acolhedorId: string | null;
};

export type ResponsibleContextError = {
  status: 401 | 403;
  code: "UNAUTHENTICATED" | "INACTIVE_ACCOUNT" | "FORBIDDEN";
  message: string;
};

export type ResponsibleContextResult =
  | { context: ResponsibleContext }
  | { error: ResponsibleContextError };

export async function getResponsibleContextForUser(
  userId: string,
): Promise<ResponsibleContextResult> {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      ativo: true,
      tipoPerfil: true,
      organizacao: { select: { id: true } },
      acolhedor: { select: { id: true } },
    },
  });

  if (!user?.ativo) {
    return {
      error: {
        status: 403,
        code: "INACTIVE_ACCOUNT",
        message: "Conta desativada",
      },
    };
  }

  if (
    user.tipoPerfil !== TipoPerfil.ORGANIZACAO &&
    user.tipoPerfil !== TipoPerfil.ACOLHEDOR
  ) {
    return {
      error: {
        status: 403,
        code: "FORBIDDEN",
        message: "Apenas organizacoes ou acolhedores podem gerenciar animais",
      },
    };
  }

  const organizacaoId = user.organizacao?.id ?? null;
  const acolhedorId = user.acolhedor?.id ?? null;
  const responsavelId =
    user.tipoPerfil === TipoPerfil.ORGANIZACAO ? organizacaoId : acolhedorId;

  if (!responsavelId) {
    return {
      error: {
        status: 403,
        code: "FORBIDDEN",
        message: "Perfil responsavel incompleto",
      },
    };
  }

  return {
    context: {
      userId,
      tipoPerfil: user.tipoPerfil,
      responsavelId,
      organizacaoId,
      acolhedorId,
    },
  };
}

export async function getResponsibleContext(): Promise<ResponsibleContextResult> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return {
      error: {
        status: 401,
        code: "UNAUTHENTICATED",
        message: "Nao autenticado",
      },
    };
  }

  return getResponsibleContextForUser(session.user.id);
}

export function ownsAnimal(
  context: ResponsibleContext,
  animal: { organizacaoId: string | null; acolhedorId: string | null } | null,
): boolean {
  if (!animal) {
    return false;
  }

  return context.tipoPerfil === TipoPerfil.ORGANIZACAO
    ? animal.organizacaoId === context.responsavelId
    : animal.acolhedorId === context.responsavelId;
}
