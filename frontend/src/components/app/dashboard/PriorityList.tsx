import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  HandHeart,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardPriorityItem, PriorityKind } from "@/lib/data/dashboard";
import {
  PRIORITY_VISIBLE_LIMIT,
  priorityKindMeta,
  resolveHref,
  visiblePriorities,
} from "@/lib/dashboard-visual";
import { formatarData } from "@/lib/date";
import { toneChipClass } from "./tone";

const kindIcon: Record<PriorityKind, LucideIcon> = {
  SAUDE_ATRASADA: AlertTriangle,
  SAUDE_HOJE: CalendarClock,
  SOLICITACAO_ANALISE: Inbox,
  ADOCAO_APROVADA_CONCLUSAO: HandHeart,
};

// Spec 011 (US1, C1): o que exige ação, no topo. Corta em 5 sem reordenar.
export function PriorityList({ items }: { items: DashboardPriorityItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const { visible } = visiblePriorities(items, expanded);
  const hasMore = items.length > PRIORITY_VISIBLE_LIMIT;

  return (
    <section aria-labelledby="painel-pendencias">
      <h2 id="painel-pendencias" className="font-serif text-xl font-semibold">
        O que precisa de atenção
      </h2>

      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
          Nada pendente no momento.
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {visible.map((item) => {
              const meta = priorityKindMeta[item.kind];
              const Icon = kindIcon[item.kind];
              return (
                <li key={`${item.kind}-${item.id}`} data-priority-item="">
                  <a
                    href={resolveHref(item.href)}
                    className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none sm:items-center"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        toneChipClass[meta.tone],
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          toneChipClass[meta.tone],
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="block font-medium">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
                      {item.dueAt && (
                        <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                          {formatarData(item.dueAt)}
                        </span>
                      )}
                    </span>
                    {item.dueAt && (
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {formatarData(item.dueAt)}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Mostrar menos" : `Mostrar todas (${items.length})`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
