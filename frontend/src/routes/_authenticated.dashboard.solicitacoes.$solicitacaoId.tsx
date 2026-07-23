import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { getSolicitacao, decidirSolicitacao, concluirAdocao } from "@/lib/data/solicitacoes";
import { getAnimal, fotoPrincipal } from "@/lib/data/animais";
import { getAdotante } from "@/lib/data/usuarios";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { TriagemReadOnly } from "@/components/app/TriagemReadOnly";

export const Route = createFileRoute("/_authenticated/dashboard/solicitacoes/$solicitacaoId")({
  head: () => ({ meta: [{ title: "Detalhe da solicitação — AdoptPlace" }, { name: "description", content: "Revise a triagem do adotante." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const { solicitacaoId } = Route.useParams();
  const s = useSessao();
  const navigate = useNavigate();
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState<"apr" | "rec" | "con" | null>(null);

  if (!s) return null;
  const solic = getSolicitacao(solicitacaoId);
  if (!solic) return <div className="text-muted-foreground">Solicitação não encontrada.</div>;
  const animal = getAnimal(solic.animalId);
  const adotante = getAdotante(solic.adotanteId);
  if (!animal || !adotante) return <div className="text-muted-foreground">Dados indisponíveis.</div>;

  const proprio =
    (s.organizacaoId && animal.organizacaoId === s.organizacaoId) ||
    (s.acolhedorId && animal.acolhedorId === s.acolhedorId);
  if (!proprio) return <div className="text-muted-foreground">Você não tem permissão para revisar esta solicitação.</div>;

  const decidir = (decisao: "APROVADA" | "RECUSADA") => {
    setSaving(decisao === "APROVADA" ? "apr" : "rec");
    try {
      decidirSolicitacao(solicitacaoId, decisao, obs || undefined);
      toast.success(decisao === "APROVADA" ? "Solicitação aprovada" : "Solicitação recusada");
      navigate({ to: "/dashboard/solicitacoes" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(null); }
  };
  const concluir = () => {
    setSaving("con");
    try { concluirAdocao(solicitacaoId); toast.success("Adoção concluída!"); navigate({ to: "/dashboard/solicitacoes" }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(null); }
  };

  const foto = fotoPrincipal(animal.id);

  return (
    <div>
      <Link to="/dashboard/solicitacoes" className="text-sm text-muted-foreground hover:text-foreground">← Solicitações</Link>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        {foto && <img src={foto.urlFoto} alt="" className="h-16 w-16 rounded-md object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl font-semibold">{adotante.nomeCompleto} → {animal.nome}</p>
          <p className="text-xs text-muted-foreground">
            Enviada em {new Date(solic.dataSolicitacao).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <StatusSolicitacaoBadge status={solic.status} />
      </div>

      <div className="mt-6">
        <h2 className="font-serif text-lg font-semibold">Triagem do adotante</h2>
        <p className="text-sm text-muted-foreground">Todas as respostas em modo somente leitura.</p>
        <div className="mt-3"><TriagemReadOnly adotante={adotante} /></div>
      </div>

      {solic.status === "EM_ANALISE" && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <Label htmlFor="obs" className="mb-1 block text-sm">Observações (opcional)</Label>
          <Textarea id="obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={saving !== null} onClick={() => decidir("APROVADA")}>
              {saving === "apr" ? "Aprovando..." : "Aprovar"}
            </Button>
            <Button variant="outline" disabled={saving !== null} onClick={() => decidir("RECUSADA")}>
              {saving === "rec" ? "Recusando..." : "Recusar"}
            </Button>
          </div>
        </div>
      )}
      {solic.status === "APROVADA" && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <Button disabled={saving !== null} onClick={concluir}>
            {saving === "con" ? "Concluindo..." : "Concluir adoção"}
          </Button>
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
