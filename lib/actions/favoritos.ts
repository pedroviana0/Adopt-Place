"use server";

import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleFavoriteSchema } from "@/lib/schemas/favorito";

export async function toggleFavorite(
  animalId: string
): Promise<{ favorited?: boolean; error?: string }> {
  // Validate input on server side
  const parsed = toggleFavoriteSchema.safeParse({ animalId });
  if (!parsed.success) {
    return { error: "Identificador do animal inválido." };
  }

  // Guard 1: Check authentication
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  // Guard 2: Role check - only ADOTANTE can favorite animals
  if (session.user.tipoPerfil !== "ADOTANTE") {
    return { error: "Apenas adotantes podem favoritar animais" };
  }

  // Guard: Ensure adotanteId exists
  if (!session.user.adotanteId) {
    return { error: "Perfil de adotante não encontrado." };
  }

  const adotanteId = session.user.adotanteId;
  const validatedAnimalId = parsed.data.animalId;

  // Check if Favorito exists
  const existingFavorito = await prisma.favorito.findUnique({
    where: {
      adotanteId_animalId: {
        adotanteId,
        animalId: validatedAnimalId,
      },
    },
  });

  if (existingFavorito) {
    // Exists: delete it
    await prisma.favorito.delete({
      where: {
        adotanteId_animalId: {
          adotanteId,
          animalId: validatedAnimalId,
        },
      },
    });
    return { favorited: false };
  } else {
    // Not exists: create it
    await prisma.favorito.create({
      data: {
        adotanteId,
        animalId: validatedAnimalId,
      },
    });
    return { favorited: true };
  }
}
