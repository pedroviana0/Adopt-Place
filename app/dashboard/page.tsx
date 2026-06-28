import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusAnimal, StatusSolicitacao } from "@prisma/client";

import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import { getServerSession } from "@/lib/auth";
import { getAdopterDashboard } from "@/lib/queries/adotante-dashboard";
import { getAdopterFavorites } from "@/lib/queries/favorites";
import { getAdopterRequests } from "@/lib/queries/adopter-requests";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";
import { getOwnerRequests } from "@/lib/queries/owner-requests";
import { getUpcomingAlerts } from "@/lib/queries/procedure-alerts";

const statusLabels: Record<StatusAnimal, string> = {
  RESGATADO: "Resgatado",
  EM_CUIDADOS: "Em cuidados",
  DISPONIVEL: "Disponivel",
  EM_PROCESSO_ADOCAO: "Em processo",
  ADOTADO: "Adotado",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.tipoPerfil === "ADOTANTE") {
    if (!session.user.adotanteId) {
      redirect("/dashboard/triagem");
    }

    const [adotante, requests, favorites] = await Promise.all([
      getAdopterDashboard(session.user.adotanteId),
      getAdopterRequests(session.user.adotanteId),
      getAdopterFavorites(session.user.adotanteId),
    ]);

    if (!adotante) {
      redirect("/dashboard/triagem");
    }

    const recentRequests = requests.slice(0, 3);

    return (
      <div className="space-y-6">
        {!adotante.triagemConcluida ? (
          <Card className="border-[var(--primary)]">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6">
              <div>
                <h1 className="text-lg font-semibold sm:text-xl">Complete sua triagem</h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  A triagem concluida e obrigatoria para solicitar adocao.
                </p>
              </div>
              <Link
                href="/dashboard/triagem"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
                aria-label="Ir para triagem"
              >
                Ir para triagem
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Acompanhe suas solicitacoes e favoritos.</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Triagem</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">
                {adotante.triagemConcluida ? "Concluida" : "Pendente"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Solicitacoes</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">{requests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Favoritos</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">{favorites.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Solicitacoes recentes</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Nenhuma solicitacao criada ainda.</p>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{request.animal.nome}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Solicitado em {formatDate(request.dataSolicitacao)}
                    </p>
                  </div>
                  <Badge variant={request.status === StatusSolicitacao.EM_ANALISE ? "outline" : "secondary"}>
                    {request.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.user.tipoPerfil === "ORGANIZACAO" || session.user.tipoPerfil === "ACOLHEDOR") {
    const responsavelId = session.user.organizacaoId ?? session.user.acolhedorId;

    if (!responsavelId) {
      redirect("/dashboard");
    }

    const [animals, requests, alerts] = await Promise.all([
      getOwnedAnimals(responsavelId, session.user.tipoPerfil),
      getOwnerRequests(responsavelId, session.user.tipoPerfil),
      getUpcomingAlerts(responsavelId, session.user.tipoPerfil),
    ]);
    const statusCounts = animals.reduce<Record<StatusAnimal, number>>(
      (acc, animal) => ({ ...acc, [animal.status]: acc[animal.status] + 1 }),
      {
        RESGATADO: 0,
        EM_CUIDADOS: 0,
        DISPONIVEL: 0,
        EM_PROCESSO_ADOCAO: 0,
        ADOTADO: 0,
      },
    );
    const pendingRequests = requests.filter((request) => request.status === StatusSolicitacao.EM_ANALISE).length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Visao operacional dos seus animais, solicitacoes e alertas.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Animais</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">{animals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Solicitacoes pendentes</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">{pendingRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">Alertas proximos</p>
              <p className="mt-1 text-xl sm:text-2xl font-semibold">{alerts.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Animais por status</h2>
          </CardHeader>
          <CardContent className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="rounded-md border p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">{statusLabels[status as StatusAnimal]}</p>
                <p className="mt-1 text-lg sm:text-xl font-semibold">{count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Proximos alertas</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Nenhum procedimento previsto para os proximos 30 dias.</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{alert.animal.nome}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">{alert.tipo.replaceAll("_", " ")}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {alert.dataProxima ? formatDate(alert.dataProxima) : ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.user.tipoPerfil === "ADMIN") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard administrativo</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Gerencie contas e acesso ao sistema.</p>
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Link
              href="/dashboard/admin/usuarios"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
              aria-label="Gerenciar usuarios"
            >
              Gerenciar usuarios
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect("/login");
}
