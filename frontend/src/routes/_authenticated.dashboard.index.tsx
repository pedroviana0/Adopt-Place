import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSessao } from "@/lib/data/hooks";
import { fetchOperationalDashboard } from "@/lib/data/dashboard";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardSkeleton } from "@/components/app/dashboard/DashboardSkeleton";
import { OperationalDashboard } from "@/components/app/dashboard/OperationalDashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashIndex,
});

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
        <DashboardSkeleton />
      ) : dashboardQuery.isError ? (
        // Spec 011 (C8): par destructive-muted, porque o --destructive direto
        // dá 3,1:1 no tema escuro (research R3).
        <Alert className="mt-6 border-transparent bg-destructive-muted text-destructive-muted-foreground [&>svg]:text-destructive-muted-foreground">
          <CircleAlert className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Não foi possível carregar o painel."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={dashboardQuery.isFetching}
              onClick={() => void dashboardQuery.refetch()}
            >
              {dashboardQuery.isFetching ? "Tentando…" : "Tentar de novo"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : dashboardQuery.data ? (
        <OperationalDashboard data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}
