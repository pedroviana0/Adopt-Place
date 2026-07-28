import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMinhasSolicitacoes } from "@/lib/data/solicitacoes";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/minhas-solicitacoes")({
  head: () => ({
    meta: [
      { title: "Minhas solicitações — AdoptPlace" },
      { name: "description", content: "Acompanhe suas solicitações de adoção." },
    ],
  }),
  component: Page,
});

function Page() {
  const solicitacoes = useQuery({
    queryKey: ["minhas-solicitacoes"],
    queryFn: fetchMinhasSolicitacoes,
  });
  const list = solicitacoes.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Minhas solicitações</h1>
      {solicitacoes.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : solicitacoes.isError ? (
        <div className="mt-6">
          <EmptyState
            title="Não foi possível carregar suas solicitações"
            action={{ label: "Tentar novamente", onClick: () => solicitacoes.refetch() }}
          />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Você ainda não fez nenhuma solicitação"
            action={{ label: "Ver vitrine", to: "/vitrine" }}
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link
                  to="/animais/$animalId"
                  params={{ animalId: s.animal.id }}
                  className="font-medium hover:underline"
                >
                  {s.animal.nome}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Enviada em {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}
                </p>
                {s.observacoes && (
                  <p className="mt-1 text-xs text-muted-foreground">{s.observacoes}</p>
                )}
              </div>
              <StatusSolicitacaoBadge status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
