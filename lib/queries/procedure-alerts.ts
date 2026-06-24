import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

type ResponsavelTipo = 'ORGANIZACAO' | 'ACOLHEDOR';

function buildProcedureAlertWhere(
  responsavelId: string,
  tipoPerfil: ResponsavelTipo,
  hojeInicio: Date,
  limite: Date,
): Prisma.RegistroSaudeWhereInput {
  const animalFilter: Prisma.AnimalWhereInput =
    tipoPerfil === 'ORGANIZACAO'
      ? { organizacaoId: responsavelId }
      : { acolhedorId: responsavelId };

  return {
    tipo: { in: ['VACINA', 'CONTROLE_PARASITAS'] },
    dataProxima: {
      gte: hojeInicio,
      lte: limite,
    },
    animal: animalFilter,
  };
}

export async function getUpcomingAlerts(
  responsavelId: string,
  tipoPerfil: ResponsavelTipo,
) {
  const agora = new Date();
  const hojeInicio = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
  );
  const limite = new Date(hojeInicio);
  limite.setDate(limite.getDate() + 30);

  const where = buildProcedureAlertWhere(
    responsavelId,
    tipoPerfil,
    hojeInicio,
    limite,
  );

  return prisma.registroSaude.findMany({
    where,
    orderBy: { dataProxima: 'asc' },
    select: {
      id: true,
      tipo: true,
      dataProxima: true,
      animal: { select: { id: true, nome: true } },
    },
  });
}

export type UpcomingAlert = NonNullable<
  Awaited<ReturnType<typeof getUpcomingAlerts>>
>[number];
