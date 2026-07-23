import {
  Prisma,
  StatusCuidadoPlanejado,
  TipoPerfil,
  TipoRegistroSaude,
} from "@prisma/client";

import { requireResponsible } from "@/lib/actions/auth-guards";
import { AuthGuardError } from "@/lib/actions/auth-guards";
import {
  classifyHealthDate,
  getApplicationDayBounds,
  getUpcomingRange,
  type HealthDateGroup,
} from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import {
  agendaFilterSchema,
  type AgendaFilters,
} from "@/lib/schemas/cuidado-planejado";

type ResponsibleSession = Awaited<ReturnType<typeof requireResponsible>>;

function ownedAnimalWhere(session: ResponsibleSession): Prisma.AnimalWhereInput {
  if (session.user.tipoPerfil === TipoPerfil.ORGANIZACAO) {
    return { organizacaoId: session.user.organizacaoId! };
  }

  return { acolhedorId: session.user.acolhedorId! };
}

function dateBounds(value: string): { start: Date; endExclusive: Date } {
  const [year, month, day] = value.split("-").map(Number);
  return getApplicationDayBounds(
    new Date(Date.UTC(year, month - 1, day, 12)),
  );
}

function plannedDateWhere(
  filters: AgendaFilters,
  reference: Date,
): Prisma.DateTimeFilter | undefined {
  let lowerBound: Date | undefined;
  let upperBound: Date | undefined;

  if (filters.from) lowerBound = dateBounds(filters.from).start;
  if (filters.to) upperBound = dateBounds(filters.to).endExclusive;

  if (filters.situacao === "ATRASADO") {
    upperBound = getApplicationDayBounds(reference).start;
  } else if (filters.situacao === "HOJE") {
    const today = getApplicationDayBounds(reference);
    lowerBound = today.start;
    upperBound = today.endExclusive;
  } else if (filters.situacao === "PROXIMO") {
    lowerBound = getUpcomingRange(30, reference).start;
  } else if (filters.situacao === "PROXIMOS_7_DIAS") {
    const range = getUpcomingRange(7, reference);
    lowerBound = range.start;
    upperBound = range.endExclusive;
  } else if (filters.situacao === "PROXIMOS_30_DIAS") {
    const range = getUpcomingRange(30, reference);
    lowerBound = range.start;
    upperBound = range.endExclusive;
  }

  if (!lowerBound && !upperBound) return undefined;
  return {
    ...(lowerBound ? { gte: lowerBound } : {}),
    ...(upperBound ? { lt: upperBound } : {}),
  };
}

function persistentStatus(
  situation: AgendaFilters["situacao"],
): StatusCuidadoPlanejado | undefined {
  if (situation === "CONCLUIDO") return StatusCuidadoPlanejado.CONCLUIDO;
  if (situation === "CANCELADO") return StatusCuidadoPlanejado.CANCELADO;
  if (situation) return StatusCuidadoPlanejado.PENDENTE;
  return undefined;
}

const plannedCareSelect = {
  id: true,
  animalId: true,
  tipo: true,
  status: true,
  dataHoraPlanejada: true,
  titulo: true,
  observacoes: true,
  localProfissional: true,
  origemRegistroSaudeId: true,
  animal: { select: { id: true, nome: true } },
} satisfies Prisma.CuidadoPlanejadoSelect;

type PlannedCareRow = Prisma.CuidadoPlanejadoGetPayload<{
  select: typeof plannedCareSelect;
}>;

export type HealthAgendaSituation =
  | "ATRASADO"
  | "HOJE"
  | "PROXIMO"
  | "CONCLUIDO"
  | "CANCELADO";

export type HealthAgendaItem = PlannedCareRow & {
  situacao: HealthAgendaSituation;
  animalHref: string;
};

function mapSituation(
  care: Pick<PlannedCareRow, "status" | "dataHoraPlanejada">,
  reference: Date,
): HealthAgendaSituation {
  if (care.status === StatusCuidadoPlanejado.CONCLUIDO) return "CONCLUIDO";
  if (care.status === StatusCuidadoPlanejado.CANCELADO) return "CANCELADO";

  const group = classifyHealthDate(care.dataHoraPlanejada, reference);
  if (group === "ATRASADO" || group === "HOJE") return group;
  return "PROXIMO";
}

function mapAgendaItem(care: PlannedCareRow, reference: Date): HealthAgendaItem {
  return {
    ...care,
    situacao: mapSituation(care, reference),
    animalHref: `/dashboard/animais/${care.animalId}/saude`,
  };
}

export async function getHealthAgenda(
  rawFilters: AgendaFilters = {},
  reference = new Date(),
): Promise<HealthAgendaItem[]> {
  const session = await requireResponsible();
  const filters = agendaFilterSchema.parse(rawFilters);
  const animalOwner = ownedAnimalWhere(session);
  const status = persistentStatus(filters.situacao);
  const dataHoraPlanejada = plannedDateWhere(filters, reference);

  const care = await prisma.cuidadoPlanejado.findMany({
    where: {
      animal: animalOwner,
      ...(filters.animalId ? { animalId: filters.animalId } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
      ...(status ? { status } : {}),
      ...(dataHoraPlanejada ? { dataHoraPlanejada } : {}),
    },
    orderBy: { dataHoraPlanejada: "asc" },
    select: plannedCareSelect,
  });

  return care.map((item) => mapAgendaItem(item, reference));
}

export type HealthOverview = {
  groups: {
    overdue: HealthAgendaItem[];
    today: HealthAgendaItem[];
    next7Days: HealthAgendaItem[];
    next30Days: HealthAgendaItem[];
  };
  animalsWithoutHistory: Array<{ id: string; nome: string; href: string }>;
  positiveTests: Array<{
    animalId: string;
    animalNome: string;
    disease: string;
    recordedAt: Date;
    href: string;
  }>;
};

export async function getHealthOverview(
  reference = new Date(),
): Promise<HealthOverview> {
  const session = await requireResponsible();
  const animalOwner = ownedAnimalWhere(session);

  const [plannedCare, animals] = await Promise.all([
    prisma.cuidadoPlanejado.findMany({
      where: {
        status: StatusCuidadoPlanejado.PENDENTE,
        animal: animalOwner,
      },
      orderBy: { dataHoraPlanejada: "asc" },
      select: plannedCareSelect,
    }),
    prisma.animal.findMany({
      where: animalOwner,
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        registrosSaude: {
          orderBy: { dataRegistro: "desc" },
          select: {
            tipo: true,
            resultado: true,
            nomeDoenca: true,
            dataRegistro: true,
          },
        },
      },
    }),
  ]);

  const groups: Record<HealthDateGroup, HealthAgendaItem[]> = {
    ATRASADO: [],
    HOJE: [],
    PROXIMOS_7_DIAS: [],
    PROXIMOS_30_DIAS: [],
    FUTURO: [],
  };

  for (const care of plannedCare) {
    groups[classifyHealthDate(care.dataHoraPlanejada, reference)].push(
      mapAgendaItem(care, reference),
    );
  }

  return {
    groups: {
      overdue: groups.ATRASADO,
      today: groups.HOJE,
      next7Days: groups.PROXIMOS_7_DIAS,
      next30Days: groups.PROXIMOS_30_DIAS,
    },
    animalsWithoutHistory: animals
      .filter((animal) => animal.registrosSaude.length === 0)
      .map((animal) => ({
        id: animal.id,
        nome: animal.nome,
        href: `/dashboard/animais/${animal.id}/saude`,
      })),
    positiveTests: animals.flatMap((animal) =>
      animal.registrosSaude
        .filter(
          (record) =>
            record.tipo === "TESTE_DOENCA" && record.resultado === "POSITIVO",
        )
        .map((record) => ({
          animalId: animal.id,
          animalNome: animal.nome,
          disease: record.nomeDoenca ?? "Teste de doenca",
          recordedAt: record.dataRegistro,
          href: `/dashboard/animais/${animal.id}/saude`,
        })),
    ),
  };
}

const healthTimelineTypes = [
  TipoRegistroSaude.VACINA,
  TipoRegistroSaude.CONTROLE_PARASITAS,
  TipoRegistroSaude.TESTE_DOENCA,
  TipoRegistroSaude.MEDICAMENTO_TRATAMENTO,
  TipoRegistroSaude.PROCEDIMENTO,
] as const;

export async function getAnimalHealthTimeline(animalId: string) {
  const session = await requireResponsible();
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, ...ownedAnimalWhere(session) },
    select: { id: true },
  });

  if (!animal) {
    throw new AuthGuardError("Acesso negado.");
  }

  return prisma.registroSaude.findMany({
    where: {
      animalId,
      tipo: { in: [...healthTimelineTypes] },
    },
    orderBy: [{ dataRegistro: "desc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      tipo: true,
      dataRegistro: true,
      dataProxima: true,
      responsavelRegistro: true,
      nomeVacina: true,
      ehVacinaCustomizada: true,
      tipoMedicamento: true,
      frequencia: true,
      nomeDoenca: true,
      ehDoencaCustomizada: true,
      resultado: true,
      titulo: true,
      procedimento: true,
      medicamentoTratamento: true,
      observacoes: true,
      profissionalClinica: true,
    },
  });
}

export type AnimalHealthTimelineItem = Awaited<
  ReturnType<typeof getAnimalHealthTimeline>
>[number];
