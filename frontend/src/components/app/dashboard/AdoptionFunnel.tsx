import { cn } from "@/lib/utils";
import type { OperationalDashboard } from "@/lib/data/dashboard";
import { funnelRows } from "@/lib/dashboard-visual";
import { toneFillClass } from "./tone";

// Spec 011 (US4, C7): três contagens independentes em barras horizontais. O
// número vai sempre escrito; a barra é decorativa.
export function AdoptionFunnel({ funnel }: { funnel: OperationalDashboard["adoptionFunnel"] }) {
  const rows = funnelRows(funnel);
  const empty = rows.every((row) => row.value === 0);

  return (
    <section aria-labelledby="painel-funil" className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 id="painel-funil" className="font-serif text-xl font-semibold">
        Funil de adoção (30 dias)
      </h2>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums">{row.value}</span>
            </div>
            <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", toneFillClass[row.tone])}
                style={{ width: `${row.widthPercent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {empty && (
        <p className="mt-3 text-sm text-muted-foreground">Nenhuma solicitação nos últimos 30 dias.</p>
      )}
    </section>
  );
}
