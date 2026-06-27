"use server";

import type { ZodError } from "zod";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  photoOrderSchema,
  type PhotoOrderInput,
} from "@/lib/schemas/foto-animal";

type ActionResult = { success?: boolean; error?: string };

function firstValidationError(error: ZodError): string {
  return error.issues[0]?.message ?? "Dados invalidos.";
}

type ResponsibleSession = {
  user: {
    id: string;
    tipoPerfil: "ORGANIZACAO" | "ACOLHEDOR";
    ativo: boolean;
    organizacaoId: string | null;
    acolhedorId: string | null;
  };
};

async function requireResponsibleSession(): Promise<
  { session: ResponsibleSession } | { error: string }
> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Nao autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (session.user.tipoPerfil !== "ORGANIZACAO" && session.user.tipoPerfil !== "ACOLHEDOR") {
    return { error: "Apenas organizacoes ou acolhedores podem gerenciar fotos" };
  }

  return { session: session as ResponsibleSession };
}

function ownsAnimal(session: ResponsibleSession, animal: { organizacaoId: string | null; acolhedorId: string | null }): boolean {
  return (
    (Boolean(session.user.organizacaoId) && animal.organizacaoId === session.user.organizacaoId) ||
    (Boolean(session.user.acolhedorId) && animal.acolhedorId === session.user.acolhedorId)
  );
}

export async function updatePhotoOrder(
  photos: PhotoOrderInput,
): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const parsed = photoOrderSchema.safeParse(photos);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error) };
  }

  const photoIds = parsed.data.map((item) => item.id);

  const fotos = await prisma.fotoAnimal.findMany({
    where: { id: { in: photoIds } },
    select: { animalId: true },
  });

  for (const foto of fotos) {
    const animal = await prisma.animal.findUnique({
      where: { id: foto.animalId },
      select: { organizacaoId: true, acolhedorId: true },
    });

    if (!animal || !ownsAnimal(sessionResult.session, animal)) {
      return { error: "Acesso negado" };
    }
  }

  await prisma.$transaction(
    parsed.data.map((item) =>
      prisma.fotoAnimal.update({
        where: { id: item.id },
        data: { ordem: item.order },
      }),
    ),
  );

  return { success: true };
}

export async function setPrimaryPhoto(fotoId: string): Promise<ActionResult> {
  const sessionResult = await requireResponsibleSession();

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  const foto = await prisma.fotoAnimal.findUnique({
    where: { id: fotoId },
    select: { animalId: true },
  });

  if (!foto) {
    return { error: "Foto nao encontrada" };
  }

  const animal = await prisma.animal.findUnique({
    where: { id: foto.animalId },
    select: { organizacaoId: true, acolhedorId: true },
  });

  if (!animal || !ownsAnimal(sessionResult.session, animal)) {
    return { error: "Acesso negado" };
  }

  await prisma.$transaction([
    prisma.fotoAnimal.updateMany({
      where: { animalId: foto.animalId },
      data: { principal: false },
    }),
    prisma.fotoAnimal.update({
      where: { id: fotoId },
      data: { principal: true },
    }),
  ]);

  return { success: true };
}
