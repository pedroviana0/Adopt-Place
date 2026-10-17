import type { OperationalDashboard } from "../../frontend/src/lib/data/dashboard";

// Spec 011: três painéis tipados pelo contrato real, sem dado novo.

const iso = (day: number) => `2026-10-${String(day).padStart(2, "0")}T15:00:00.000Z`;

export const organizacaoCheia: OperationalDashboard = {
  indicators: {
    availableAnimals: { count: 12, href: "/dashboard/animais?status=DISPONIVEL" },
    animalsInCare: { count: 4, href: "/dashboard/animais?status=EM_CUIDADOS" },
    animalsInAdoptionProcess: { count: 2, href: "/dashboard/animais?status=EM_PROCESSO_ADOCAO" },
    requestsWaitingReview: { count: 3, href: "/dashboard/solicitacoes?status=EM_ANALISE" },
    overdueHealthCare: { count: 2, href: "/dashboard/saude/agenda?situacao=ATRASADO" },
    next7DaysHealthCare: { count: 5, href: "/dashboard/saude/agenda?situacao=PROXIMOS_7_DIAS" },
    animalsInTreatment: { count: 1, href: "/dashboard/animais?tratamento=1" },
    animalsSeekingFoster: { count: 6, href: "/dashboard/animais?lt=PROCURANDO" },
    animalsInFosterUnregistered: { count: 1, href: "/dashboard/animais?lt=EM_LT_SEM_VINCULO" },
  },
  priorityItems: [
    { id: "c1", kind: "SAUDE_ATRASADA", title: "Vermifugo", subtitle: "Thor", dueAt: iso(10), href: "/dashboard/saude/agenda?animalId=a1&situacao=ATRASADO" },
    { id: "c2", kind: "SAUDE_ATRASADA", title: "Vacina V10", subtitle: "Luna", dueAt: iso(12), href: "/dashboard/saude/agenda?animalId=a2&situacao=ATRASADO" },
    { id: "c3", kind: "SAUDE_HOJE", title: "Antibiotico", subtitle: "Seninha", dueAt: iso(17), href: "/dashboard/saude/agenda?animalId=a3&situacao=HOJE" },
    { id: "s1", kind: "SOLICITACAO_ANALISE", title: "Analisar solicitacao de Bela", subtitle: "Aguardando analise", href: "/dashboard/solicitacoes/s1" },
    { id: "s2", kind: "SOLICITACAO_ANALISE", title: "Analisar solicitacao de Gaia", subtitle: "Aguardando analise", href: "/dashboard/solicitacoes/s2" },
    { id: "s3", kind: "SOLICITACAO_ANALISE", title: "Analisar solicitacao de Toby", subtitle: "Aguardando analise", href: "/dashboard/solicitacoes/s3" },
    { id: "s4", kind: "ADOCAO_APROVADA_CONCLUSAO", title: "Concluir adocao de Otto", subtitle: "Aprovada e aguardando conclusao", href: "/dashboard/solicitacoes/s4" },
  ],
  adoptionFunnel: { inAnalysis: 3, approvedOrInProcess: 2, completedInPeriod: 1 },
  animalStatusCounts: { EM_CUIDADOS: 4, DISPONIVEL: 12, EM_PROCESSO_ADOCAO: 2, ADOTADO: 2 },
  recentActivity: [
    { id: "r1", kind: "ANIMAL_CADASTRADO", label: "Animal cadastrado: Cacau", occurredAt: iso(16), href: "/dashboard/animais/a9" },
    { id: "r2", kind: "SAUDE_REGISTRADA", label: "Saude registrada: Seninha", occurredAt: iso(16), href: "/dashboard/animais/a3/saude" },
    { id: "r3", kind: "SOLICITACAO_RECEBIDA", label: "Solicitacao recebida: Bela", occurredAt: iso(15), href: "/dashboard/solicitacoes/s1" },
    { id: "r4", kind: "SOLICITACAO_APROVADA", label: "Solicitacao aprovada: Otto", occurredAt: iso(14), href: "/dashboard/solicitacoes/s4" },
    { id: "r5", kind: "ADOCAO_CONCLUIDA", label: "Adocao concluida: Mel", occurredAt: iso(13) },
  ],
  unreadMessages: 2,
};

const { animalsSeekingFoster: _seeking, animalsInFosterUnregistered: _unregistered, ...semLt } =
  organizacaoCheia.indicators;

export const acolhedor: OperationalDashboard = {
  ...organizacaoCheia,
  indicators: semLt,
};

const zero = { count: 0, href: "/dashboard/animais" };

export const vazio: OperationalDashboard = {
  indicators: {
    availableAnimals: { ...zero, href: "/dashboard/animais?status=DISPONIVEL" },
    animalsInCare: { ...zero, href: "/dashboard/animais?status=EM_CUIDADOS" },
    animalsInAdoptionProcess: { ...zero, href: "/dashboard/animais?status=EM_PROCESSO_ADOCAO" },
    requestsWaitingReview: { ...zero, href: "/dashboard/solicitacoes?status=EM_ANALISE" },
    overdueHealthCare: { ...zero, href: "/dashboard/saude/agenda?situacao=ATRASADO" },
    next7DaysHealthCare: { ...zero, href: "/dashboard/saude/agenda?situacao=PROXIMOS_7_DIAS" },
    animalsInTreatment: { ...zero, href: "/dashboard/animais?tratamento=1" },
  },
  priorityItems: [],
  adoptionFunnel: { inAnalysis: 0, approvedOrInProcess: 0, completedInPeriod: 0 },
  animalStatusCounts: { EM_CUIDADOS: 0, DISPONIVEL: 0, EM_PROCESSO_ADOCAO: 0, ADOTADO: 0 },
  recentActivity: [],
  unreadMessages: 0,
};
