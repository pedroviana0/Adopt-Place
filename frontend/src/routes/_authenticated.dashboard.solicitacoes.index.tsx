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
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";
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

  const doDecidir = async (id: string, decisao: "APROVADA" | "RECUSADA", throwOnError = false) => {
    setPending(id);
    try {
      await decidirSolicitacao(id, decisao);
      await invalidate();
      toast.success(decisao === "APROVADA" ? "Aprovada" : "Recusada");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      if (throwOnError) throw new Error(message);
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
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      throw new Error(message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="font-serif text-3xl font-semibold">Solicitações</h1>
      <AsyncState
        isLoading={solicitacoesQuery.isLoading}
        isError={solicitacoesQuery.isError}
        error={solicitacoesQuery.error}
        onRetry={() => solicitacoesQuery.refetch()}
        isEmpty={
          !solicitacoesQuery.isLoading &&
          !solicitacoesQuery.isError &&
          (solicitacoesQuery.data?.length ?? 0) === 0
        }
        emptyState={{
          title: "Nenhuma solicitação recebida",
          description: "As novas solicitações de adoção aparecerão aqui.",
        }}
      >
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
                      <ConfirmDestructiveAction
                        title="Recusar esta solicitação?"
                        item={`${s.adotante.nomeCompleto} → ${s.animal.nome}`}
                        consequence="A decisão será registrada e o adotante verá a solicitação como recusada."
                        confirmLabel="Recusar solicitação"
                        disabled={busy}
                        onConfirm={() => doDecidir(s.id, "RECUSADA", true)}
                        trigger={
                          <Button size="sm" variant="outline">
                            Recusar
                          </Button>
                        }
                      />
                    </>
                  )}
                  {s.status === "APROVADA" && (
                    <ConfirmDestructiveAction
                      title="Concluir esta adoção?"
                      item={`${s.adotante.nomeCompleto} → ${s.animal.nome}`}
                      consequence="O animal e a solicitação passarão ao estado final de adoção conforme as regras atuais."
                      confirmLabel="Concluir adoção"
                      disabled={busy}
                      onConfirm={() => doConcluir(s.id)}
                      trigger={<Button size="sm">Concluir adoção</Button>}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </AsyncState>
    </div>
  );
}
