import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSessao } from "@/lib/data/hooks";
import { fetchOperationalDashboard } from "@/lib/data/dashboard";
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
        <p className="mt-6 text-sm text-muted-foreground">Carregando painel…</p>
      ) : dashboardQuery.isError ? (
        <p className="mt-6 text-sm text-destructive">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Não foi possível carregar o painel."}
        </p>
      ) : dashboardQuery.data ? (
        <OperationalDashboard data={dashboardQuery.data} />
      ) : null}
    </div>
  );
}
