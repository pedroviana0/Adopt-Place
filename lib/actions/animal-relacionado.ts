"use server";

import type { Session } from "next-auth";
import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  animalRelacionadoSchema,
  type AnimalRelacionadoInput,
} from "@/lib/schemas/animal-relacionado";

type ResponsibleRole = "ORGANIZACAO" | "ACOLHEDOR";

type ResponsibleSession = Session & {
  user: Session["user"] & {
    tipoPerfil: ResponsibleRole;
  };
};

type OwnedAnimal = {
  id: string;
  organizacaoId: string | null;
  acolhedorId: string | null;
};

type ActionResult = { success?: boolean; error?: string };

function firstValidationError(error: ZodError): string {
  const message = error.issues[0]?.message ?? "Dados invalidos.";

  if (message === "Um animal não pode ser relacionado a si mesmo.") {
    return "Um animal não pode ser relacionado a si mesmo";
  }

  return message;
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

function ownsAnimal(session: ResponsibleSession, animal: OwnedAnimal | null): boolean {
  if (!animal) {
    return false;
  }

  return (
    (Boolean(session.user.organizacaoId) &&
      animal.organizacaoId === session.user.organizacaoId) ||
    (Boolean(session.user.acolhedorId) && animal.acolhedorId === session.user.acolhedorId)
  );
}

async function findAnimal(id: string): Promise<OwnedAnimal | null> {
  return prisma.animal.findUnique({
    where: { id },
    select: {
      id: true,
      organizacaoId: true,
      acolhedorId: true,
    },
  });
}

async function ownsBothAnimals(
  session: ResponsibleSession,
  animalId: string,
  animalRelacionadoId: string,
): Promise<boolean> {
  const [animal, animalRelacionado] = await Promise.all([
    findAnimal(animalId),
    findAnimal(animalRelacionadoId),
  ]);

  return ownsAnimal(session, animal) && ownsAnimal(session, animalRelacionado);
}

export async function linkAnimals(data: AnimalRelacionadoInput): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = animalRelacionadoSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const { animalId, animalRelacionadoId } = parsed.data;

  if (!(await ownsBothAnimals(sessionResult.session, animalId, animalRelacionadoId))) {
    return { error: "Acesso negado" };
  }

  await prisma.$transaction(async (tx) => {
    const existingRelationship = await tx.animalRelacionado.findFirst({
      where: {
        OR: [
          { animalId, animalRelacionadoId },
          { animalId: animalRelacionadoId, animalRelacionadoId: animalId },
        ],
      },
      select: {
        animalId: true,
        animalRelacionadoId: true,
      },
    });

    if (existingRelationship) {
      return;
    }

    await tx.animalRelacionado.createMany({
      data: [
        { animalId, animalRelacionadoId },
        { animalId: animalRelacionadoId, animalRelacionadoId: animalId },
      ],
      skipDuplicates: true,
    });
  });

  return { success: true };
}

export async function unlinkAnimals(
  animalId: string,
  animalRelacionadoId: string,
): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = animalRelacionadoSchema.safeParse({ animalId, animalRelacionadoId });

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const validatedAnimalId = parsed.data.animalId;
  const validatedRelacionadoId = parsed.data.animalRelacionadoId;

  if (!(await ownsBothAnimals(sessionResult.session, validatedAnimalId, validatedRelacionadoId))) {
    return { error: "Acesso negado" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.animalRelacionado.deleteMany({
      where: {
        OR: [
          { animalId: validatedAnimalId, animalRelacionadoId: validatedRelacionadoId },
          { animalId: validatedRelacionadoId, animalRelacionadoId: validatedAnimalId },
        ],
      },
    });
  });

  return { success: true };
}
