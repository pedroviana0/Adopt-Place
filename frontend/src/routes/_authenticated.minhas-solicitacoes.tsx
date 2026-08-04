import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMinhasSolicitacoes } from "@/lib/data/solicitacoes";
import { fetchConversas } from "@/lib/data/mensagens";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";

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
  const conversas = useQuery({
    queryKey: ["conversas", "todas"],
    queryFn: () => fetchConversas("todas"),
  });
  const list = solicitacoes.data ?? [];
  const conversationByRequest = new Map(
    (conversas.data?.conversations ?? []).map((conversation) => [
      conversation.requestId,
      conversation.id,
    ]),
  );

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
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
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
              <div className="flex items-center gap-2">
                <StatusSolicitacaoBadge status={s.status} />
                {(s.status === "APROVADA" || s.status === "CONCLUIDA") &&
                  conversationByRequest.has(s.id) && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        to="/mensagens/$conversaId"
                        params={{ conversaId: conversationByRequest.get(s.id)! }}
                      >
                        Abrir conversa
                      </Link>
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
