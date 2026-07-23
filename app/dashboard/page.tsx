import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusSolicitacao } from "@prisma/client";

import { DashboardEmptyState } from "@/components/app/dashboard/dashboard-empty-state";
import { DashboardErrorState } from "@/components/app/dashboard/dashboard-error-state";
import { OperationalDashboard } from "@/components/app/dashboard/operational-dashboard";
import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import { getServerSession } from "@/lib/auth";
import { getAdopterDashboard } from "@/lib/queries/adotante-dashboard";
import { getAdopterFavorites } from "@/lib/queries/favorites";
import { getAdopterRequests } from "@/lib/queries/adopter-requests";
import { getOperationalDashboard } from "@/lib/queries/operational-dashboard";
import { getUnreadMessageCount } from "@/lib/queries/mensagens";

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

    const [adotante, requests, favorites, unreadMessages] = await Promise.all([
      getAdopterDashboard(session.user.adotanteId),
      getAdopterRequests(session.user.adotanteId),
      getAdopterFavorites(session.user.adotanteId),
      getUnreadMessageCount(),
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

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Acompanhe suas solicitacoes e favoritos.</p>
          </div>
          {unreadMessages > 0 ? <Link className="text-sm font-medium underline-offset-4 hover:underline" href="/dashboard/mensagens">{unreadMessages} mensagens nao lidas</Link> : null}
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
    let dashboard;
    try {
      const [operationalData, unreadMessages] = await Promise.all([
        getOperationalDashboard(),
        getUnreadMessageCount(),
      ]);
      dashboard = { ...operationalData, unreadMessages };
    } catch {
      return <DashboardErrorState />;
    }
    const isEmpty =
      Object.values(dashboard.animalStatusCounts).every((count) => count === 0) &&
      dashboard.adoptionFunnel.inAnalysis === 0 &&
      dashboard.adoptionFunnel.approvedOrInProcess === 0 &&
      dashboard.adoptionFunnel.completedInPeriod === 0 &&
      dashboard.priorityItems.length === 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            O que precisa da sua atencao agora.
          </p>
        </div>
        {isEmpty ? <DashboardEmptyState /> : <OperationalDashboard data={dashboard} />}
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
