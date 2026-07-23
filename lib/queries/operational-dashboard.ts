import { Prisma, StatusAnimal, TipoPerfil } from "@prisma/client";

import { requireResponsible } from "@/lib/actions/auth-guards";
import { classifyHealthDate, getUpcomingRange } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

type ResponsibleSession = Awaited<ReturnType<typeof requireResponsible>>;

function ownerWhere(session: ResponsibleSession): Prisma.AnimalWhereInput {
  return session.user.tipoPerfil === TipoPerfil.ORGANIZACAO
    ? { organizacaoId: session.user.organizacaoId! }
    : { acolhedorId: session.user.acolhedorId! };
}

type PriorityItem = {
  id: string;
  kind:
    | "SAUDE_ATRASADA"
    | "SAUDE_HOJE"
    | "SOLICITACAO_ANALISE"
    | "ADOCAO_APROVADA_CONCLUSAO";
  title: string;
  subtitle: string;
  dueAt?: Date;
  href: string;
};

type RecentActivity = {
  id: string;
  kind:
    | "ANIMAL_CADASTRADO"
    | "SAUDE_REGISTRADA"
    | "SOLICITACAO_RECEBIDA"
    | "SOLICITACAO_APROVADA"
    | "ADOCAO_CONCLUIDA";
  label: string;
  occurredAt: Date;
  href?: string;
};

const statusInitial: Record<StatusAnimal, number> = {
  RESGATADO: 0,
  EM_CUIDADOS: 0,
  DISPONIVEL: 0,
  EM_PROCESSO_ADOCAO: 0,
  ADOTADO: 0,
};

export async function getOperationalDashboard(reference = new Date()) {
  const session = await requireResponsible();
  const animalOwner = ownerWhere(session);
  const next7 = getUpcomingRange(7, reference);
  const periodStart = new Date(reference);
  periodStart.setUTCDate(periodStart.getUTCDate() - 30);

  const [animals, requests, care, healthRecords] = await Promise.all([
    prisma.animal.findMany({
      where: animalOwner,
      select: { id: true, nome: true, status: true, criadoEm: true },
    }),
    prisma.solicitacaoAdocao.findMany({
      where: { animal: animalOwner },
      select: {
        id: true,
        status: true,
        dataSolicitacao: true,
        dataAtualizacao: true,
        animal: { select: { id: true, nome: true } },
      },
    }),
    prisma.cuidadoPlanejado.findMany({
      where: {
        status: "PENDENTE",
        dataHoraPlanejada: { lt: next7.endExclusive },
        animal: animalOwner,
      },
      orderBy: { dataHoraPlanejada: "asc" },
      select: {
        id: true,
        titulo: true,
        dataHoraPlanejada: true,
        animal: { select: { id: true, nome: true } },
      },
    }),
    prisma.registroSaude.findMany({
      where: { animal: animalOwner },
      orderBy: { criadoEm: "desc" },
      take: 10,
      select: {
        id: true,
        tipo: true,
        criadoEm: true,
        animal: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const animalStatusCounts = animals.reduce<Record<StatusAnimal, number>>(
    (counts, animal) => ({ ...counts, [animal.status]: counts[animal.status] + 1 }),
    { ...statusInitial },
  );
  const overdue = care.filter(
    (item) => classifyHealthDate(item.dataHoraPlanejada, reference) === "ATRASADO",
  );
  const today = care.filter(
    (item) => classifyHealthDate(item.dataHoraPlanejada, reference) === "HOJE",
  );
  const upcoming7 = care.filter(
    (item) => classifyHealthDate(item.dataHoraPlanejada, reference) === "PROXIMOS_7_DIAS",
  );
  const inAnalysis = requests.filter((request) => request.status === "EM_ANALISE");
  const approved = requests.filter((request) => request.status === "APROVADA");
  const completedInPeriod = requests.filter(
    (request) =>
      request.status === "CONCLUIDA" && request.dataAtualizacao >= periodStart,
  );

  const priorityItems: PriorityItem[] = [
    ...overdue.map((item) => ({
      id: item.id,
      kind: "SAUDE_ATRASADA" as const,
      title: item.titulo,
      subtitle: item.animal.nome,
      dueAt: item.dataHoraPlanejada,
      href: `/dashboard/saude/agenda?animalId=${item.animal.id}&situacao=ATRASADO`,
    })),
    ...today.map((item) => ({
      id: item.id,
      kind: "SAUDE_HOJE" as const,
      title: item.titulo,
      subtitle: item.animal.nome,
      dueAt: item.dataHoraPlanejada,
      href: `/dashboard/saude/agenda?animalId=${item.animal.id}&situacao=HOJE`,
    })),
    ...inAnalysis.map((request) => ({
      id: request.id,
      kind: "SOLICITACAO_ANALISE" as const,
      title: `Analisar solicitacao de ${request.animal.nome}`,
      subtitle: "Aguardando analise",
      href: `/dashboard/solicitacoes/${request.id}`,
    })),
    ...approved.map((request) => ({
      id: request.id,
      kind: "ADOCAO_APROVADA_CONCLUSAO" as const,
      title: `Concluir adocao de ${request.animal.nome}`,
      subtitle: "Aprovada e aguardando conclusao",
      href: `/dashboard/solicitacoes/${request.id}`,
    })),
  ];

  const recentActivity: RecentActivity[] = [
    ...animals.map((animal) => ({
      id: animal.id,
      kind: "ANIMAL_CADASTRADO" as const,
      label: `${animal.nome} foi cadastrado`,
      occurredAt: animal.criadoEm,
      href: `/dashboard/animais/${animal.id}/saude`,
    })),
    ...healthRecords.map((record) => ({
      id: record.id,
      kind: "SAUDE_REGISTRADA" as const,
      label: `Saude registrada para ${record.animal.nome}`,
      occurredAt: record.criadoEm,
      href: `/dashboard/animais/${record.animal.id}/saude`,
    })),
    ...requests.flatMap<RecentActivity>((request) => {
      const received: RecentActivity = {
        id: `received-${request.id}`,
        kind: "SOLICITACAO_RECEBIDA",
        label: `Solicitacao recebida para ${request.animal.nome}`,
        occurredAt: request.dataSolicitacao,
        href: `/dashboard/solicitacoes/${request.id}`,
      };
      if (request.status === "APROVADA") {
        return [received, { id: request.id, kind: "SOLICITACAO_APROVADA", label: `Solicitacao aprovada para ${request.animal.nome}`, occurredAt: request.dataAtualizacao, href: `/dashboard/solicitacoes/${request.id}` }];
      }
      if (request.status === "CONCLUIDA") {
        return [received, { id: request.id, kind: "ADOCAO_CONCLUIDA", label: `Adocao concluida de ${request.animal.nome}`, occurredAt: request.dataAtualizacao, href: `/dashboard/solicitacoes/${request.id}` }];
      }
      return [received];
    }),
  ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, 10);

  return {
    indicators: {
      availableAnimals: { count: animalStatusCounts.DISPONIVEL, href: "/dashboard/animais?status=DISPONIVEL" },
      animalsInCare: { count: animalStatusCounts.EM_CUIDADOS, href: "/dashboard/animais?status=EM_CUIDADOS" },
      animalsInAdoptionProcess: { count: animalStatusCounts.EM_PROCESSO_ADOCAO, href: "/dashboard/animais?status=EM_PROCESSO_ADOCAO" },
      requestsWaitingReview: { count: inAnalysis.length, href: "/dashboard/solicitacoes?status=EM_ANALISE" },
      overdueHealthCare: { count: overdue.length, href: "/dashboard/saude/agenda?situacao=ATRASADO" },
      next7DaysHealthCare: { count: upcoming7.length, href: "/dashboard/saude/agenda?situacao=PROXIMOS_7_DIAS" },
    },
    priorityItems,
    adoptionFunnel: {
      inAnalysis: inAnalysis.length,
      approvedOrInProcess: approved.length,
      completedInPeriod: completedInPeriod.length,
    },
    animalStatusCounts,
    recentActivity,
    unreadMessages: 0,
  };
}

export type OperationalDashboardData = Awaited<
  ReturnType<typeof getOperationalDashboard>
>;
