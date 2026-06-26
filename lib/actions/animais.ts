"use server";

import { StatusAnimal } from "@prisma/client";
import type { Session } from "next-auth";
import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { animalInputSchema } from "@/lib/schemas/animal";
import type { AnimalInput } from "@/lib/schemas/animal";

type ResponsibleRole = "ORGANIZACAO" | "ACOLHEDOR";

type ResponsibleSession = Session & {
  user: Session["user"] & {
    tipoPerfil: ResponsibleRole;
  };
};

type OwnedAnimal = {
  organizacaoId: string | null;
  acolhedorId: string | null;
  status: StatusAnimal;
};

type ActionResult = { success?: boolean; error?: string };

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

function isResponsibleRole(role: Session["user"]["tipoPerfil"]): role is ResponsibleRole {
  return role === "ORGANIZACAO" || role === "ACOLHEDOR";
}

async function requireResponsibleSession(): Promise<
  { session: ResponsibleSession } | { error: string }
> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (!isResponsibleRole(session.user.tipoPerfil)) {
    return { error: "Apenas organizações ou acolhedores podem gerenciar animais" };
  }

  return { session: session as ResponsibleSession };
}

function ownsAnimal(session: ResponsibleSession, animal: OwnedAnimal): boolean {
  return (
    (Boolean(session.user.organizacaoId) &&
      animal.organizacaoId === session.user.organizacaoId) ||
    (Boolean(session.user.acolhedorId) && animal.acolhedorId === session.user.acolhedorId)
  );
}

function inputOwnerMatchesSession(session: ResponsibleSession, data: AnimalInput): boolean {
  if (session.user.tipoPerfil === "ORGANIZACAO") {
    return Boolean(session.user.organizacaoId) && data.organizacaoId === session.user.organizacaoId;
  }

  return Boolean(session.user.acolhedorId) && data.acolhedorId === session.user.acolhedorId;
}

async function findAnimalById(id: string): Promise<OwnedAnimal | null> {
  return prisma.animal.findUnique({
    where: { id },
    select: {
      organizacaoId: true,
      acolhedorId: true,
      status: true,
    },
  });
}

export async function createAnimal(data: AnimalInput): Promise<{ id?: string; error?: string }> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = animalInputSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  if (!inputOwnerMatchesSession(sessionResult.session, parsed.data)) {
    return { error: "Acesso negado" };
  }

  const animal = await prisma.animal.create({
    data: parsed.data,
    select: { id: true },
  });

  return { id: animal.id };
}

export async function updateAnimal(id: string, data: AnimalInput): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const animal = await findAnimalById(id);

  if (!animal) {
    return { error: "Animal não encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, animal)) {
    return { error: "Acesso negado" };
  }

  const parsed = animalInputSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  await prisma.animal.update({
    where: { id },
    data: parsed.data,
  });

  return { success: true };
}

export async function updateAnimalStatus(id: string, status: StatusAnimal): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const animal = await findAnimalById(id);

  if (!animal) {
    return { error: "Animal não encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.animal.update({
    where: { id },
    data: { status },
  });

  return { success: true };
}

export async function deleteAnimal(id: string): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const animal = await findAnimalById(id);

  if (!animal) {
    return { error: "Animal não encontrado" };
  }

  if (!ownsAnimal(sessionResult.session, animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.animal.delete({
    where: { id },
  });

  return { success: true };
}
