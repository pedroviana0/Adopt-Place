import { StatusAnimal, StatusSolicitacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublicMetrics() {
  const [availableAnimals, completedAdoptions, organizations, fosters] = await prisma.$transaction([
    prisma.animal.count({ where: { status: StatusAnimal.DISPONIVEL } }),
    prisma.solicitacaoAdocao.count({ where: { status: StatusSolicitacao.CONCLUIDA } }),
    prisma.organizacao.count(),
    prisma.acolhedorIndependente.count(),
  ]);

  return {
    availableAnimals,
    completedAdoptions,
    responsibleParties: organizations + fosters,
  };
}
