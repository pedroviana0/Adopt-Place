import { AlertTriangle, CalendarClock, CircleAlert, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui";
import type { HealthAgendaItem, HealthOverview as HealthOverviewData } from "@/lib/queries/health-dashboard";

function CareGroup({ title, items }: { title: string; items: HealthAgendaItem[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-[var(--muted-foreground)]">Nenhum cuidado neste periodo.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="flex items-center justify-between gap-3 p-3 hover:bg-[var(--muted)]" href={`/dashboard/saude/agenda?animalId=${item.animalId}`}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.titulo}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{item.animal.nome}</span>
                </span>
                <time className="shrink-0 text-xs" dateTime={item.dataHoraPlanejada.toISOString()}>
                  {item.dataHoraPlanejada.toLocaleDateString("pt-BR")}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HealthOverview({ overview }: { overview: HealthOverviewData }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <CareGroup title="Cuidados atrasados" items={overview.groups.overdue} />
        <CareGroup title="Cuidados para hoje" items={overview.groups.today} />
        <CareGroup title="Proximos 7 dias" items={overview.groups.next7Days} />
        <CareGroup title="Proximos 30 dias" items={overview.groups.next30Days} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b pb-2">
          <CircleAlert className="size-4" aria-hidden="true" />
          <h2 className="font-semibold">Animais que precisam de atencao</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Stethoscope className="size-4" aria-hidden="true" />
              <h3 className="text-sm font-medium">Sem historico de saude</h3>
            </div>
            {overview.animalsWithoutHistory.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Todos os animais possuem registros.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.animalsWithoutHistory.map((animal) => (
                  <li key={animal.id}><Link className="underline-offset-4 hover:underline" href={animal.href}>{animal.nome}</Link></li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--destructive)]">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <h3 className="text-sm font-medium">Testes positivos</h3>
            </div>
            {overview.positiveTests.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Nenhum teste positivo registrado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.positiveTests.map((test) => (
                  <li key={`${test.animalId}-${test.recordedAt.toISOString()}`}>
                    <Link className="flex items-center gap-2 underline-offset-4 hover:underline" href={test.href}>
                      <CalendarClock className="size-4" aria-hidden="true" />
                      {test.animalNome}: {test.disease}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
