import { Card, CardContent } from "@/components/ui/card";
import type { DashboardIndicator, DashboardPriorityItem, OperationalDashboard as Data } from "@/lib/data/dashboard";
import { resolveHref } from "@/lib/dashboard-visual";
import { statusAnimalLabel } from "@/lib/domain/enums";
import { formatarData } from "@/lib/date";

// Spec 011: painel de gestão extraído da rota. Recebe os dados por prop para o
// render estático dos testes (__tests__/frontend/dashboard-render.test.ts).
export function OperationalDashboard({ data }: { data: Data }) {
  const ind = data.indicators;
  const indicators: { label: string; value: DashboardIndicator }[] = [
    { label: "Disponíveis", value: ind.availableAnimals },
    { label: "Em cuidados", value: ind.animalsInCare },
    { label: "Em processo de adoção", value: ind.animalsInAdoptionProcess },
    { label: "Solicitações aguardando análise", value: ind.requestsWaitingReview },
    { label: "Cuidados atrasados", value: ind.overdueHealthCare },
    { label: "Cuidados nos próximos 7 dias", value: ind.next7DaysHealthCare },
    // Spec 009: os dois de LT so chegam no JSON para organizacao.
    { label: "Em tratamento", value: ind.animalsInTreatment },
    ...(ind.animalsSeekingFoster
      ? [{ label: "Procurando LT", value: ind.animalsSeekingFoster }]
      : []),
    ...(ind.animalsInFosterUnregistered
      ? [{ label: "Em LT sem registro", value: ind.animalsInFosterUnregistered }]
      : []),
  ];

  return (
    <div className="mt-6 space-y-8">
      {/* Indicadores clicáveis */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((item) => (
          <a key={item.label} href={resolveHref(item.value.href)} className="block">
            <Card className="transition hover:border-primary">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-serif text-3xl font-semibold">{item.value.count}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Pendências priorizadas */}
      <section>
        <h2 className="font-serif text-xl font-semibold">O que precisa de atenção</h2>
        {data.priorityItems.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nada pendente no momento. 🎉</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {data.priorityItems.map((item: DashboardPriorityItem) => (
              <li key={`${item.kind}-${item.id}`} className="p-3">
                <a
                  href={resolveHref(item.href)}
                  className="flex items-center justify-between gap-2 hover:underline"
                >
                  <span>
                    <span className="font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                  {item.dueAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatarData(item.dueAt)}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Funil de adoção */}
      <section>
        <h2 className="font-serif text-xl font-semibold">Funil de adoção (30 dias)</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Mini label="Em análise" value={data.adoptionFunnel.inAnalysis} />
          <Mini label="Aprovadas / em processo" value={data.adoptionFunnel.approvedOrInProcess} />
          <Mini label="Concluídas no período" value={data.adoptionFunnel.completedInPeriod} />
        </div>
      </section>

      {/* Resumo de animais */}
      <section>
        <h2 className="font-serif text-xl font-semibold">Meus animais por status</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(data.animalStatusCounts) as (keyof typeof data.animalStatusCounts)[]).map(
            (key) => (
              <Mini key={key} label={statusAnimalLabel[key]} value={data.animalStatusCounts[key]} />
            ),
          )}
        </div>
      </section>

      {/* Atividade recente */}
      {data.recentActivity.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold">Atividade recente</h2>
          <ul className="mt-3 divide-y rounded-xl border bg-card text-sm">
            {data.recentActivity.map((activity) => (
              <li
                key={`${activity.kind}-${activity.id}`}
                className="flex justify-between gap-2 p-3"
              >
                <span>{activity.label}</span>
                <span className="text-muted-foreground">{formatarData(activity.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-serif text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
