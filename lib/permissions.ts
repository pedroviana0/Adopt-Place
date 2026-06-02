import type { Session } from "next-auth";
import type { TipoPerfil } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AppSession = Session & {
  user: Session["user"] & {
    id: string;
    tipoPerfil: TipoPerfil;
    ativo: boolean;
    adotanteId: string | null;
    organizacaoId: string | null;
    acolhedorId: string | null;
  };
};

export function isActiveSession(session: Session | null): session is AppSession {
  return Boolean(session?.user?.id && session.user.ativo);
}

export function hasRole(session: AppSession, roles: readonly TipoPerfil[]): boolean {
  return roles.includes(session.user.tipoPerfil);
}

export function isAdmin(session: AppSession): boolean {
  return session.user.tipoPerfil === "ADMIN";
}

export function isAdopter(session: AppSession): boolean {
  return session.user.tipoPerfil === "ADOTANTE" && Boolean(session.user.adotanteId);
}

export function isResponsibleUser(session: AppSession): boolean {
  return (
    (session.user.tipoPerfil === "ORGANIZACAO" && Boolean(session.user.organizacaoId)) ||
    (session.user.tipoPerfil === "ACOLHEDOR" && Boolean(session.user.acolhedorId))
  );
}

export async function ownsAnimal(session: AppSession, animalId: string): Promise<boolean> {
  if (!isResponsibleUser(session)) {
    return false;
  }

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });

  if (!animal) {
    return false;
  }

  return (
    animal.organizacaoId === session.user.organizacaoId ||
    animal.acolhedorId === session.user.acolhedorId
  );
}

export async function ownsHealthRecord(session: AppSession, recordId: string): Promise<boolean> {
  if (!isResponsibleUser(session)) {
    return false;
  }

  const record = await prisma.registroSaude.findUnique({
    where: { id: recordId },
    select: { animalId: true },
  });

  return record ? ownsAnimal(session, record.animalId) : false;
}
