import type { Prisma } from "@prisma/client";

import type { ResponsibleContext } from "@/lib/api/responsible-context";
import { prisma } from "@/lib/prisma";

const healthRecordSelect = {
  id: true,
  tipo: true,
  dataRegistro: true,
  dataProxima: true,
  responsavelRegistro: true,
  titulo: true,
  observacoes: true,
  profissionalClinica: true,
  nomeVacina: true,
  ehVacinaCustomizada: true,
  tipoMedicamento: true,
  frequencia: true,
  nomeDoenca: true,
  ehDoencaCustomizada: true,
  resultado: true,
  medicamentoTratamento: true,
  procedimento: true,
} satisfies Prisma.RegistroSaudeSelect;

function ownershipFilter(context: ResponsibleContext) {
  return context.tipoPerfil === "ORGANIZACAO"
    ? { organizacaoId: context.responsavelId }
    : { acolhedorId: context.responsavelId };
}

export async function getOwnedHealthRecords(
  animalId: string,
  context: ResponsibleContext,
) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, ...ownershipFilter(context) },
    select: { id: true },
  });
  if (!animal) return null;

  return prisma.registroSaude.findMany({
    where: { animalId },
    orderBy: { dataRegistro: "desc" },
    select: healthRecordSelect,
  });
}

export async function getOwnedHealthRecord(
  recordId: string,
  animalId: string,
  context: ResponsibleContext,
) {
  return prisma.registroSaude.findFirst({
    where: {
      id: recordId,
      animalId,
      animal: ownershipFilter(context),
    },
    select: healthRecordSelect,
  });
}

export type HealthRecord = NonNullable<
  Awaited<ReturnType<typeof getOwnedHealthRecord>>
>;

export function toHealthRecordDTO(record: HealthRecord) {
  return {
    id: record.id,
    tipoRegistro: record.tipo,
    dataAplicacao: record.dataRegistro.toISOString(),
    dataProxima: record.dataProxima?.toISOString() ?? null,
    responsavelRegistro: record.responsavelRegistro,
    titulo: record.titulo,
    observacoes: record.observacoes,
    profissionalClinica: record.profissionalClinica,
    nomeVacina: record.nomeVacina,
    ehVacinaCustomizada: record.ehVacinaCustomizada,
    tipoMedicamento: record.tipoMedicamento,
    frequencia: record.frequencia,
    nomeDoenca: record.nomeDoenca,
    ehDoencaCustomizada: record.ehDoencaCustomizada,
    resultado: record.resultado,
    medicamentoTratamento: record.medicamentoTratamento,
    procedimento: record.procedimento,
  };
}
