import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSessao } from "@/lib/data/hooks";
import {
  fetchOperationalDashboard,
  type DashboardIndicator,
  type DashboardPriorityItem,
  type OperationalDashboard,
} from "@/lib/data/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { statusAnimalLabel } from "@/lib/domain/enums";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashIndex,
});

// The backend derives drill-down hrefs assuming a dedicated agenda route; the
// current health surface lives at /dashboard/saude, so normalize that prefix.
function resolveHref(href: string): string {
  return href.replace("/dashboard/saude/agenda", "/dashboard/saude");
}

function DashIndex() {
  const s = useSessao();
  const dashboardQuery = useQuery({
    queryKey: ["operational-dashboard"],
    queryFn: fetchOperationalDashboard,
    enabled: s?.tipoPerfil === "ORGANIZACAO" || s?.tipoPerfil === "ACOLHEDOR",
  });

  if (!s) return null;

  // ADMIN não tem painel operacional (a query é exclusiva de responsáveis).
  // Em vez do cabeçalho vazio, mostra o destino real da administração.
  if (s.tipoPerfil === "ADMIN") {
    return (
      <div>
        <h1 className="font-serif text-3xl font-semibold">Administração</h1>
        <p className="text-sm text-muted-foreground">Olá, {s.nome}!</p>
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="font-medium text-foreground">Contas de usuário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte as contas cadastradas e ative ou desative o acesso.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dashboard/admin/usuarios">Gerenciar usuários</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Painel</h1>
      <p className="text-sm text-muted-foreground">Olá, {s.nome}!</p>

      {dashboardQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando painel…</p>
      ) : dashboardQuery.isError ? (
        <p className="mt-6 text-sm text-destructive">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Não foi possível carregar o painel."}
        </p>
      ) : dashboardQuery.data ? (
        <Dashboard data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}

function Dashboard({ data }: { data: OperationalDashboard }) {
  const ind = data.indicators;
  const indicators: { label: string; value: DashboardIndicator }[] = [
    { label: "Disponíveis", value: ind.availableAnimals },
    { label: "Em cuidados", value: ind.animalsInCare },
    { label: "Em processo de adoção", value: ind.animalsInAdoptionProcess },
    { label: "Solicitações aguardando análise", value: ind.requestsWaitingReview },
    { label: "Cuidados atrasados", value: ind.overdueHealthCare },
    { label: "Cuidados nos próximos 7 dias", value: ind.next7DaysHealthCare },
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
                      {new Date(item.dueAt).toLocaleDateString("pt-BR")}
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
                <span className="text-muted-foreground">
                  {new Date(activity.occurredAt).toLocaleDateString("pt-BR")}
                </span>
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
