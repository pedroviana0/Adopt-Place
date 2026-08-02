import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSolicitacoesGerenciadas,
  decidirSolicitacao,
  concluirAdocao,
} from "@/lib/data/solicitacoes";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações — AdoptPlace" },
      { name: "description", content: "Solicitações de adoção recebidas." },
    ],
  }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const solicitacoesQuery = useQuery({
    queryKey: ["solicitacoes-gerenciadas"],
    queryFn: () => fetchSolicitacoesGerenciadas(),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["solicitacoes-gerenciadas"] });

  const doDecidir = async (id: string, decisao: "APROVADA" | "RECUSADA") => {
    setPending(id);
    try {
      await decidirSolicitacao(id, decisao);
      await invalidate();
      toast.success(decisao === "APROVADA" ? "Aprovada" : "Recusada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setPending(null);
    }
  };
  const doConcluir = async (id: string) => {
    setPending(id);
    try {
      await concluirAdocao(id);
      await invalidate();
      toast.success("Adoção concluída!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Solicitações</h1>
      {solicitacoesQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : solicitacoesQuery.isError ? (
        <p className="mt-6 text-sm text-destructive">
          {solicitacoesQuery.error instanceof Error
            ? solicitacoesQuery.error.message
            : "Não foi possível carregar as solicitações."}
        </p>
      ) : (solicitacoesQuery.data?.length ?? 0) === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nenhuma solicitação recebida" />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {solicitacoesQuery.data!.map((s) => {
            const busy = pending === s.id;
            return (
              <li key={s.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {s.adotante.nomeCompleto} →{" "}
                      <Link
                        to="/animais/$animalId"
                        params={{ animalId: s.animal.id }}
                        className="hover:underline"
                      >
                        {s.animal.nome}
                      </Link>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enviada em {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <StatusSolicitacaoBadge status={s.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/dashboard/solicitacoes/$solicitacaoId"
                      params={{ solicitacaoId: s.id }}
                    >
                      Revisar triagem
                    </Link>
                  </Button>
                  {s.status === "EM_ANALISE" && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => doDecidir(s.id, "APROVADA")}>
                        {busy ? "..." : "Aprovar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => doDecidir(s.id, "RECUSADA")}
                      >
                        {busy ? "..." : "Recusar"}
                      </Button>
                    </>
                  )}
                  {s.status === "APROVADA" && (
                    <Button size="sm" disabled={busy} onClick={() => doConcluir(s.id)}>
                      {busy ? "..." : "Concluir adoção"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
