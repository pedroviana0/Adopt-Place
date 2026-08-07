import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { fetchSolicitacoesGerenciadas } from "@/lib/data/solicitacoes";
import { AsyncState } from "@/components/app/AsyncState";

export const Route = createFileRoute("/_authenticated/dashboard/adotados")({
  head: () => ({ meta: [{ title: "Adoções concluídas — AdoptPlace" }] }),
  component: AdotadosPage,
});

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function AdotadosPage() {
  const query = useQuery({
    queryKey: ["adocoes-concluidas"],
    queryFn: () => fetchSolicitacoesGerenciadas("CONCLUIDA"),
  });
  const itens = query.data ?? [];

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Adoções concluídas</h1>
      <p className="text-sm text-muted-foreground">
        Histórico das adoções finalizadas dos seus animais.
      </p>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={itens.length === 0}
        loadingLabel="Carregando adoções concluídas…"
        errorTitle="Não foi possível carregar as adoções"
        onRetry={() => query.refetch()}
        emptyState={{
          title: "Nenhuma adoção concluída ainda",
          description:
            "Quando você concluir uma solicitação aprovada, ela aparece aqui com o adotante e a data.",
        }}
      >
        <ul className="mt-6 divide-y divide-border rounded-xl border bg-card">
          {itens.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <Link
                    to="/animais/$animalId"
                    params={{ animalId: item.animal.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.animal.nome}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Adotado por {item.adotante.nomeCompleto}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Concluída em {formatarData(item.dataAtualizacao)}
              </span>
            </li>
          ))}
        </ul>
      </AsyncState>
    </div>
  );
}
