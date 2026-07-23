"use client";

import { CalendarSync, Check, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge, Button, Input, Select } from "@/components/ui";
import { cancelCuidadoPlanejado, completeCuidadoPlanejado, rescheduleCuidadoPlanejado } from "@/lib/actions/cuidados-planejados";
import type { HealthAgendaItem } from "@/lib/queries/health-dashboard";
import { agendaFilterSchema, reagendarCuidadoSchema, type AgendaFilters } from "@/lib/schemas/cuidado-planejado";

type AnimalOption = { id: string; nome: string };

export function HealthAgendaList({ items, filters, animals }: { items: HealthAgendaItem[]; filters: AgendaFilters; animals: AnimalOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function applyFilters(form: FormData) {
    const candidate = Object.fromEntries(Array.from(form.entries()).filter(([, value]) => value));
    const parsed = agendaFilterSchema.safeParse(candidate);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Filtros invalidos.");
    const params = new URLSearchParams(candidate as Record<string, string>);
    router.push(`/dashboard/saude/agenda?${params.toString()}`);
  }

  function reschedule(id: string) {
    const parsed = reagendarCuidadoSchema.safeParse({ dataHoraPlanejada: new Date(newDate) });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Data invalida.");
    startTransition(async () => {
      const result = await rescheduleCuidadoPlanejado(id, parsed.data);
      if (result.error) return setError(result.error);
      setRescheduleId(null); setNewDate(""); router.refresh();
    });
  }

  function cancel(id: string) {
    if (!window.confirm("Cancelar este cuidado planejado?")) return;
    startTransition(async () => {
      const result = await cancelCuidadoPlanejado(id, { confirmado: true });
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  function completeConsultation(id: string) {
    startTransition(async () => {
      const result = await completeCuidadoPlanejado(id);
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form action={applyFilters} className="grid gap-3 border-y py-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select name="animalId" defaultValue={filters.animalId ?? ""} aria-label="Filtrar por animal"><option value="">Todos os animais</option>{animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.nome}</option>)}</Select>
        <Select name="tipo" defaultValue={filters.tipo ?? ""} aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>{["VACINA", "CONTROLE_PARASITAS", "TESTE_DOENCA", "MEDICAMENTO_TRATAMENTO", "PROCEDIMENTO", "CONSULTA"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</Select>
        <Select name="situacao" defaultValue={filters.situacao ?? ""} aria-label="Filtrar por situacao"><option value="">Todas as situacoes</option>{["ATRASADO", "HOJE", "PROXIMO", "CONCLUIDO", "CANCELADO", "PROXIMOS_7_DIAS", "PROXIMOS_30_DIAS"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</Select>
        <Input name="from" type="date" defaultValue={filters.from ?? ""} aria-label="Data inicial" />
        <div className="flex gap-2"><Input name="to" type="date" defaultValue={filters.to ?? ""} aria-label="Data final" /><Button type="submit">Filtrar</Button></div>
      </form>
      {error ? <p role="alert" className="text-sm text-[var(--destructive)]">{error}</p> : null}
      {items.length === 0 ? <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhum cuidado encontrado para estes filtros.</p> : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => {
            const active = item.status === "PENDENTE";
            return <li key={item.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><h3 className="font-medium">{item.titulo}</h3><Badge variant={item.situacao === "ATRASADO" ? "destructive" : "outline"}>{item.situacao}</Badge></div><p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.animal.nome} | {item.tipo.replaceAll("_", " ")} | {item.dataHoraPlanejada.toLocaleString("pt-BR")}</p></div>
                <div className="flex gap-1">
                  <Link href={item.animalHref}><Button variant="ghost" className="size-10 p-0" title="Abrir animal"><ExternalLink className="size-4" /></Button></Link>
                  {active && item.tipo === "CONSULTA" ? <Button variant="ghost" className="size-10 p-0" title="Concluir consulta" disabled={isPending} onClick={() => completeConsultation(item.id)}><Check className="size-4" /></Button> : null}
                  {active && item.tipo !== "CONSULTA" ? <Link href={`${item.animalHref}?completeCare=${item.id}`}><Button variant="ghost" className="size-10 p-0" title="Registrar realizacao"><Check className="size-4" /></Button></Link> : null}
                  {active ? <Button variant="ghost" className="size-10 p-0" title="Reagendar" onClick={() => setRescheduleId(item.id)}><CalendarSync className="size-4" /></Button> : null}
                  {active ? <Button variant="ghost" className="size-10 p-0" title="Cancelar" disabled={isPending} onClick={() => cancel(item.id)}><Trash2 className="size-4" /></Button> : null}
                </div>
              </div>
              {rescheduleId === item.id ? <div className="flex max-w-md gap-2"><Input type="datetime-local" value={newDate} onChange={(event) => setNewDate(event.target.value)} /><Button disabled={isPending} onClick={() => reschedule(item.id)}>Salvar</Button><Button variant="ghost" onClick={() => setRescheduleId(null)}>Fechar</Button></div> : null}
            </li>;
          })}
        </ul>
      )}
    </div>
  );
}
