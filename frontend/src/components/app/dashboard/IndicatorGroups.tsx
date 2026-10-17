import {
  AlertTriangle,
  CalendarClock,
  EyeOff,
  HeartPulse,
  Hourglass,
  House,
  Inbox,
  PawPrint,
  Pill,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperationalDashboard } from "@/lib/data/dashboard";
import {
  buildIndicatorGroups,
  type GroupId,
  type IndicatorCard,
  type IndicatorKey,
} from "@/lib/dashboard-visual";
import { groupIconClass, toneBorderClass, toneChipClass } from "./tone";

const groupIcon: Record<GroupId, LucideIcon> = {
  adocao: PawPrint,
  saude: HeartPulse,
  lt: House,
};

const cardIcon: Record<IndicatorKey, LucideIcon> = {
  availableAnimals: PawPrint,
  animalsInCare: EyeOff,
  animalsInAdoptionProcess: Hourglass,
  requestsWaitingReview: Inbox,
  overdueHealthCare: AlertTriangle,
  next7DaysHealthCare: CalendarClock,
  animalsInTreatment: Pill,
  animalsSeekingFoster: Search,
  animalsInFosterUnregistered: House,
};

// Spec 011 (US2, C2–C4): indicadores agrupados. A cor do grupo fica só no ícone
// do título; a cor do estado fica no chip de cada card.
export function IndicatorGroups({
  indicators,
}: {
  indicators: OperationalDashboard["indicators"];
}) {
  const groups = buildIndicatorGroups(indicators);

  return (
    <section aria-labelledby="painel-indicadores" className="space-y-6">
      <h2 id="painel-indicadores" className="sr-only">
        Indicadores
      </h2>
      {groups.map((group) => {
        const Icon = groupIcon[group.id];
        return (
          <section key={group.id} aria-labelledby={`painel-grupo-${group.id}`}>
            <h3
              id={`painel-grupo-${group.id}`}
              className="flex items-center gap-2 font-serif text-lg font-semibold"
            >
              <Icon className={cn("h-5 w-5", groupIconClass[group.tone])} aria-hidden="true" />
              {group.title}
            </h3>
            {group.id === "adocao" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Em cuidados = ainda não anunciado
              </p>
            )}
            <ul className="mt-3 grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
              {group.cards.map((card) => (
                <li key={card.key}>
                  <IndicatorCardLink card={card} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}

function IndicatorCardLink({ card }: { card: IndicatorCard }) {
  const Icon = cardIcon[card.key];
  return (
    <a
      href={card.href}
      className={cn(
        "flex h-full items-center gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none sm:flex-col sm:items-start sm:p-4",
        card.requiresAction && ["border-2", toneBorderClass[card.tone]],
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          toneChipClass[card.tone],
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm text-muted-foreground sm:flex-none">{card.label}</span>
      <span
        className={cn(
          "font-serif text-2xl font-semibold tabular-nums sm:text-3xl",
          card.count === 0 && "text-muted-foreground",
        )}
      >
        {card.count}
      </span>
      {card.requiresAction && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            toneChipClass[card.tone],
          )}
        >
          Requer ação
        </span>
      )}
    </a>
  );
}
