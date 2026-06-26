"use server";

import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  setUserActiveSchema,
  type SetUserActiveInput,
} from "@/lib/schemas/admin-user";

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

export async function setUserActive(
  data: SetUserActiveInput,
): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Nao autenticado" };
  }

  if (session.user.tipoPerfil !== "ADMIN") {
    return { error: "Acesso negado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  const parsed = setUserActiveSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  await prisma.usuario.update({
    where: { id: parsed.data.userId },
    data: { ativo: parsed.data.ativo },
  });

  return { success: true };
}
