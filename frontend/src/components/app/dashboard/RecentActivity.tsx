import { Heart, Inbox, PawPrint, Stethoscope, ThumbsUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityKind, DashboardActivity } from "@/lib/data/dashboard";
import { activityKindTone, resolveHref } from "@/lib/dashboard-visual";
import { formatarData } from "@/lib/date";
import { toneChipClass } from "./tone";

const kindIcon: Record<ActivityKind, LucideIcon> = {
  ANIMAL_CADASTRADO: PawPrint,
  SAUDE_REGISTRADA: Stethoscope,
  SOLICITACAO_RECEBIDA: Inbox,
  SOLICITACAO_APROVADA: ThumbsUp,
  ADOCAO_CONCLUIDA: Heart,
};

const rowClass = "flex items-center gap-3 p-3";

// Spec 011 (US5, C5): o texto vem do backend; o ícone só marca o tipo.
export function RecentActivity({ items }: { items: DashboardActivity[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="painel-atividade">
      <h2 id="painel-atividade" className="font-serif text-xl font-semibold">
        Atividade recente
      </h2>
      <ul className="mt-3 divide-y rounded-xl border bg-card text-sm">
        {items.map((activity) => {
          const Icon = kindIcon[activity.kind];
          const content = (
            <>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  toneChipClass[activityKindTone[activity.kind]],
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">{activity.label}</span>
              <span className="shrink-0 text-muted-foreground">{formatarData(activity.occurredAt)}</span>
            </>
          );
          return (
            <li key={`${activity.kind}-${activity.id}`}>
              {activity.href ? (
                <a
                  href={resolveHref(activity.href)}
                  data-activity-link=""
                  className={cn(
                    rowClass,
                    "rounded-xl transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
                  )}
                >
                  {content}
                </a>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
