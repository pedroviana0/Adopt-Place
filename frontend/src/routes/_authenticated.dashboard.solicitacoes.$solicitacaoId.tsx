import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  fetchSolicitacaoGerenciada,
  decidirSolicitacao,
  concluirAdocao,
} from "@/lib/data/solicitacoes";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { TriagemReadOnly } from "@/components/app/TriagemReadOnly";
import { AsyncState } from "@/components/app/AsyncState";
import { ConfirmDestructiveAction } from "@/components/app/ConfirmDestructiveAction";

export const Route = createFileRoute("/_authenticated/dashboard/solicitacoes/$solicitacaoId")({
  head: () => ({
    meta: [
      { title: "Detalhe da solicitação — AdoptPlace" },
      { name: "description", content: "Revise a triagem do adotante." },
    ],
  }),
  component: Page,
});

function Page() {
  const { solicitacaoId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState<"apr" | "rec" | "con" | null>(null);

  const solicitacaoQuery = useQuery({
    queryKey: ["solicitacao-gerenciada", solicitacaoId],
    queryFn: () => fetchSolicitacaoGerenciada(solicitacaoId),
  });

  if (solicitacaoQuery.isLoading || solicitacaoQuery.isError || !solicitacaoQuery.data)
    return (
      <AsyncState
        isLoading={solicitacaoQuery.isLoading}
        isError={solicitacaoQuery.isError}
        error={solicitacaoQuery.error}
        onRetry={() => solicitacaoQuery.refetch()}
        isEmpty={!solicitacaoQuery.isLoading && !solicitacaoQuery.isError && !solicitacaoQuery.data}
        emptyState={{
          title: "Solicitação não encontrada",
          description: "Ela pode ter sido removida ou não estar disponível para este perfil.",
          action: { label: "Voltar às solicitações", to: "/dashboard/solicitacoes" },
        }}
      >
        <span />
      </AsyncState>
    );

  const solic = solicitacaoQuery.data;

  const afterMutation = async (msg: string) => {
    await queryClient.invalidateQueries({ queryKey: ["solicitacoes-gerenciadas"] });
    await queryClient.invalidateQueries({ queryKey: ["solicitacao-gerenciada", solicitacaoId] });
    toast.success(msg);
    navigate({ to: "/dashboard/solicitacoes" });
  };

  const decidir = async (decisao: "APROVADA" | "RECUSADA", throwOnError = false) => {
    setSaving(decisao === "APROVADA" ? "apr" : "rec");
    try {
      await decidirSolicitacao(solicitacaoId, decisao, obs || undefined);
      await afterMutation(decisao === "APROVADA" ? "Solicitação aprovada" : "Solicitação recusada");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      if (throwOnError) throw new Error(message);
    } finally {
      setSaving(null);
    }
  };
  const concluir = async () => {
    setSaving("con");
    try {
      await concluirAdocao(solicitacaoId);
      await afterMutation("Adoção concluída!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro";
      toast.error(message);
      throw new Error(message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <Link
        to="/dashboard/solicitacoes"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Solicitações
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl font-semibold">
            <Link
              to="/adotantes/$adotanteId"
              params={{ adotanteId: solic.adotante.id }}
              className="hover:underline"
            >
              {solic.adotante.nomeCompleto}
            </Link>{" "}
            → {solic.animal.nome}
          </p>
          <p className="text-xs text-muted-foreground">
            Enviada em {new Date(solic.dataSolicitacao).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <StatusSolicitacaoBadge status={solic.status} />
      </div>

      <div className="mt-6">
        <h2 className="font-serif text-lg font-semibold">Triagem do adotante</h2>
        <p className="text-sm text-muted-foreground">Todas as respostas em modo somente leitura.</p>
        <div className="mt-3">
          <TriagemReadOnly adotante={solic.adotante} />
        </div>
      </div>

      {solic.status === "EM_ANALISE" && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <Label htmlFor="obs" className="mb-1 block text-sm">
            Observações (opcional)
          </Label>
          <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={saving !== null} onClick={() => decidir("APROVADA")}>
              {saving === "apr" ? "Aprovando..." : "Aprovar"}
            </Button>
            <ConfirmDestructiveAction
              title="Recusar esta solicitação?"
              item={`${solic.adotante.nomeCompleto} → ${solic.animal.nome}`}
              consequence="A observação informada e a decisão serão registradas para o adotante."
              confirmLabel="Recusar solicitação"
              disabled={saving !== null}
              onConfirm={() => decidir("RECUSADA", true)}
              trigger={<Button variant="outline">Recusar</Button>}
            />
          </div>
        </div>
      )}
      {solic.status === "APROVADA" && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <ConfirmDestructiveAction
            title="Concluir esta adoção?"
            item={`${solic.adotante.nomeCompleto} → ${solic.animal.nome}`}
            consequence="O animal e a solicitação passarão ao estado final de adoção conforme as regras atuais."
            confirmLabel="Concluir adoção"
            disabled={saving !== null}
            onConfirm={concluir}
            trigger={<Button>Concluir adoção</Button>}
          />
        </div>
      )}
      {solic.observacoes && (
        <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Observações registradas</p>
          <p>{solic.observacoes}</p>
        </div>
      )}
    </div>
  );
}
