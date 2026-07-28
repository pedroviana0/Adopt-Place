import { prisma } from "@/lib/prisma";

export async function getAdopterDashboard(adotanteId: string) {
  return prisma.adotante.findUnique({
    where: { id: adotanteId },
    select: {
      id: true,
      nomeCompleto: true,
      triagemConcluida: true,
    },
  });
}

export type AdopterDashboard = NonNullable<Awaited<ReturnType<typeof getAdopterDashboard>>>;
