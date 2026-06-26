"use server";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleFavoriteSchema } from "@/lib/schemas/favorito";

export async function toggleFavorite(
  animalId: string,
): Promise<{ favorited?: boolean; error?: string }> {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return { error: "Nao autenticado" };
  }

  if (!session.user.ativo) {
    return { error: "Conta desativada" };
  }

  if (session.user.tipoPerfil !== "ADOTANTE") {
    return { error: "Apenas adotantes podem favoritar animais" };
  }

  if (!session.user.adotanteId) {
    return { error: "Perfil de adotante nao encontrado." };
  }

  const parsed = toggleFavoriteSchema.safeParse({ animalId });
  if (!parsed.success) {
    return { error: "Identificador do animal invalido." };
  }

  const adotanteId = session.user.adotanteId;
  const validatedAnimalId = parsed.data.animalId;

  const existingFavorito = await prisma.favorito.findUnique({
    where: {
      adotanteId_animalId: {
        adotanteId,
        animalId: validatedAnimalId,
      },
    },
  });

  if (existingFavorito) {
    await prisma.favorito.delete({
      where: {
        adotanteId_animalId: {
          adotanteId,
          animalId: validatedAnimalId,
        },
      },
    });

    return { favorited: false };
  }

  await prisma.favorito.create({
    data: {
      adotanteId,
      animalId: validatedAnimalId,
    },
  });

  return { favorited: true };
}
