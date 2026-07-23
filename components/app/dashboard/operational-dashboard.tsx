import { Activity, CalendarDays, Cat, CheckCircle2, ClipboardCheck, Clock3, HeartHandshake, MessageCircle, Plus, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Badge, Card, CardContent } from "@/components/ui";
import type { OperationalDashboardData } from "@/lib/queries/operational-dashboard";

const indicatorDefinitions = [
  ["availableAnimals", "Animais disponiveis", Cat],
  ["animalsInCare", "Em cuidados", Stethoscope],
  ["animalsInAdoptionProcess", "Em processo de adocao", HeartHandshake],
  ["requestsWaitingReview", "Solicitacoes para analisar", ClipboardCheck],
  ["overdueHealthCare", "Cuidados atrasados", Clock3],
  ["next7DaysHealthCare", "Cuidados nos proximos 7 dias", CalendarDays],
] as const;

const statusLabels = {
  RESGATADO: "Resgatados",
  EM_CUIDADOS: "Em cuidados",
  DISPONIVEL: "Disponiveis",
  EM_PROCESSO_ADOCAO: "Em processo",
  ADOTADO: "Adotados",
} as const;

export function OperationalDashboard({ data }: { data: OperationalDashboardData }) {
  return <div className="space-y-8">
    <section aria-labelledby="indicators-title" className="space-y-3">
      <div className="flex items-center justify-between"><h2 id="indicators-title" className="text-lg font-semibold">Agora</h2>{data.unreadMessages > 0 ? <Link className="flex items-center gap-2 text-sm font-medium" href="/dashboard/mensagens"><MessageCircle className="size-4" />{data.unreadMessages} nao lidas</Link> : null}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {indicatorDefinitions.map(([key, label, Icon]) => { const indicator = data.indicators[key]; return <Link key={key} href={indicator.href} className="min-w-0"><Card className="h-full transition hover:border-[var(--primary)]"><CardContent className="flex min-h-28 flex-col justify-between gap-3"><Icon className="size-5 text-[var(--primary)]" aria-hidden="true" /><div><p className="text-2xl font-semibold">{indicator.count}</p><p className="break-words text-xs text-[var(--muted-foreground)] sm:text-sm">{label}</p></div></CardContent></Card></Link>; })}
      </div>
    </section>

    <section className="space-y-3"><div className="flex items-center justify-between border-b pb-2"><h2 className="text-lg font-semibold">Pendencias prioritarias</h2><Badge variant={data.priorityItems.length > 0 ? "default" : "secondary"}>{data.priorityItems.length}</Badge></div>{data.priorityItems.length === 0 ? <p className="py-4 text-sm text-[var(--muted-foreground)]">Nenhuma pendencia prioritaria.</p> : <ol className="divide-y rounded-md border">{data.priorityItems.map((item) => <li key={`${item.kind}-${item.id}`}><Link className="flex items-center justify-between gap-3 p-4 hover:bg-[var(--muted)]" href={item.href}><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="block text-xs text-[var(--muted-foreground)]">{item.subtitle}</span></span>{item.dueAt ? <time className="shrink-0 text-xs" dateTime={item.dueAt.toISOString()}>{item.dueAt.toLocaleDateString("pt-BR")}</time> : <CheckCircle2 className="size-4 shrink-0" />}</Link></li>)}</ol>}</section>

    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3"><h2 className="border-b pb-2 text-lg font-semibold">Funil de adocao</h2><dl className="grid grid-cols-3 divide-x rounded-md border py-4 text-center"><div className="px-2"><dt className="text-xs text-[var(--muted-foreground)]">Em analise</dt><dd className="mt-1 text-xl font-semibold">{data.adoptionFunnel.inAnalysis}</dd></div><div className="px-2"><dt className="text-xs text-[var(--muted-foreground)]">Aprovadas</dt><dd className="mt-1 text-xl font-semibold">{data.adoptionFunnel.approvedOrInProcess}</dd></div><div className="px-2"><dt className="text-xs text-[var(--muted-foreground)]">Concluidas</dt><dd className="mt-1 text-xl font-semibold">{data.adoptionFunnel.completedInPeriod}</dd></div></dl></section>
      <section className="space-y-3"><h2 className="border-b pb-2 text-lg font-semibold">Animais por status</h2><dl className="divide-y rounded-md border">{Object.entries(statusLabels).map(([status, label]) => <div key={status} className="flex items-center justify-between px-4 py-2 text-sm"><dt>{label}</dt><dd className="font-semibold">{data.animalStatusCounts[status as keyof typeof statusLabels]}</dd></div>)}</dl></section>
    </div>

    <section className="space-y-3"><div className="flex items-center gap-2 border-b pb-2"><Activity className="size-4" /><h2 className="text-lg font-semibold">Atividade recente</h2></div>{data.recentActivity.length === 0 ? <p className="py-4 text-sm text-[var(--muted-foreground)]">Nenhuma atividade registrada.</p> : <ul className="space-y-2">{data.recentActivity.map((activity) => <li key={`${activity.kind}-${activity.id}`} className="flex items-center justify-between gap-3 text-sm"><span>{activity.href ? <Link className="underline-offset-4 hover:underline" href={activity.href}>{activity.label}</Link> : activity.label}</span><time className="shrink-0 text-xs text-[var(--muted-foreground)]" dateTime={activity.occurredAt.toISOString()}>{activity.occurredAt.toLocaleDateString("pt-BR")}</time></li>)}</ul>}</section>

    <section className="space-y-3"><h2 className="border-b pb-2 text-lg font-semibold">Acoes rapidas</h2><div className="flex flex-wrap gap-2"><Link className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]" href="/dashboard/animais?modo=criar"><Plus className="size-4" />Cadastrar animal</Link><Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium" href="/dashboard/animais"><Stethoscope className="size-4" />Registrar saude</Link><Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium" href="/dashboard/solicitacoes?status=EM_ANALISE"><ClipboardCheck className="size-4" />Analisar solicitacoes</Link><Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium" href="/dashboard/saude/agenda"><CalendarDays className="size-4" />Abrir agenda</Link></div></section>
  </div>;
}
