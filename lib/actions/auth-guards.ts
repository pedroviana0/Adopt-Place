"use server";

import type { TipoPerfil } from "@prisma/client";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
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
    throw new AuthGuardError("Conta inativa.");
  }

  return session;
}

export async function requireRole(roles: readonly TipoPerfil[]): Promise<AppSession> {
  const session = await requireSession();

  if (!hasRole(session, roles)) {
    throw new AuthGuardError("Acesso negado.");
  }

  return session;
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
