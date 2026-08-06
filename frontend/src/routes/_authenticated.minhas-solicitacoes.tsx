import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMinhasSolicitacoes } from "@/lib/data/solicitacoes";
import { fetchConversas } from "@/lib/data/mensagens";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { AsyncState } from "@/components/app/AsyncState";
import { Skeleton } from "@/components/ui/skeleton";

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
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe o andamento das suas solicitações de adoção.
      </p>
      <AsyncState
        isLoading={solicitacoes.isLoading}
        isError={solicitacoes.isError}
        error={solicitacoes.error}
        isEmpty={list.length === 0}
        loadingLabel="Carregando suas solicitações…"
        loadingFallback={<RequestListSkeleton />}
        errorTitle="Não foi possível carregar suas solicitações"
        onRetry={() => solicitacoes.refetch()}
        emptyState={{
          title: "Você ainda não fez nenhuma solicitação",
          description: "Conheça os animais disponíveis e inicie uma adoção responsável.",
          action: { label: "Ver vitrine", to: "/vitrine" },
        }}
      >
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  to="/animais/$animalId"
                  params={{ animalId: s.animal.id }}
                  className="break-words font-medium hover:underline"
                >
                  {s.animal.nome}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Enviada em {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}
                </p>
                {s.observacoes && (
                  <p className="mt-1 break-words text-xs text-muted-foreground">{s.observacoes}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
      </AsyncState>
    </div>
  );
}

function RequestListSkeleton() {
  return (
    <div className="mt-6 divide-y rounded-xl border bg-card" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}
