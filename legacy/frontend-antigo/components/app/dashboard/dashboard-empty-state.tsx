import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";

export function DashboardEmptyState() {
  return <section className="border-y py-12 text-center"><h2 className="text-lg font-semibold">Comece cadastrando seus animais</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted-foreground)]">O painel exibira cuidados, solicitacoes e atividade assim que houver dados operacionais.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]" href="/dashboard/animais?modo=criar"><Plus className="size-4" />Cadastrar animal</Link><Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium" href="/dashboard/saude/agenda"><CalendarDays className="size-4" />Abrir agenda</Link></div></section>;
}
