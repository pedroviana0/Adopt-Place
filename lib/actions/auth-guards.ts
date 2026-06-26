"use server";

import type { TipoPerfil } from "@prisma/client";
import { redirect } from "next/navigation";

import { getServerSession, INACTIVE_ACCOUNT_MESSAGE } from "@/lib/auth";
import { hasRole, isActiveSession, type AppSession } from "@/lib/permissions";

export class AuthGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthGuardError";
  }
}

export async function requireSession(): Promise<AppSession> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!isActiveSession(session)) {
    throw new AuthGuardError(INACTIVE_ACCOUNT_MESSAGE);
  }

  return session;
}

function roleList(roleOrRoles: TipoPerfil | readonly TipoPerfil[]): readonly TipoPerfil[] {
  return typeof roleOrRoles === "string" ? [roleOrRoles] : roleOrRoles;
}

function assertRole(session: AppSession, roles: readonly TipoPerfil[]): AppSession {
  if (!hasRole(session, roles)) {
    throw new AuthGuardError("Acesso negado.");
  }

  return session;
}

export function requireRole(
  session: AppSession,
  roleOrRoles: TipoPerfil | readonly TipoPerfil[],
): AppSession;
export function requireRole(roles: readonly TipoPerfil[]): Promise<AppSession>;
export function requireRole(
  sessionOrRoles: AppSession | readonly TipoPerfil[],
  roleOrRoles?: TipoPerfil | readonly TipoPerfil[],
): AppSession | Promise<AppSession> {
  if (!("user" in sessionOrRoles)) {
    return requireSession().then((session) => assertRole(session, sessionOrRoles));
  }

  if (!roleOrRoles) {
    throw new AuthGuardError("Acesso negado.");
  }

  return assertRole(sessionOrRoles, roleList(roleOrRoles));
}

export async function requireAdopter(): Promise<AppSession> {
  const session = await requireRole(["ADOTANTE"]);

  if (!session.user.adotanteId) {
    throw new AuthGuardError("Perfil de adotante nao encontrado.");
  }

  return session;
}

export async function requireResponsible(): Promise<AppSession> {
  const session = await requireRole(["ORGANIZACAO", "ACOLHEDOR"]);

  if (!session.user.organizacaoId && !session.user.acolhedorId) {
    throw new AuthGuardError("Perfil responsavel nao encontrado.");
  }

  return session;
}

export async function requireAdmin(): Promise<AppSession> {
  return requireRole(["ADMIN"]);
}
