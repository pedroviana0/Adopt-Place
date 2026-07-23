import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listSolicitacoesPorResponsavel, decidirSolicitacao, concluirAdocao } from "@/lib/data/solicitacoes";
import { getAnimal } from "@/lib/data/animais";
import { getAdotante } from "@/lib/data/usuarios";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/solicitacoes/")({
  head: () => ({ meta: [{ title: "Solicitações — AdoptPlace" }, { name: "description", content: "Solicitações de adoção recebidas." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  const [pending, setPending] = useState<string | null>(null);
  if (!s) return null;
  const list = listSolicitacoesPorResponsavel({ organizacaoId: s.organizacaoId, acolhedorId: s.acolhedorId });

  const doDecidir = (id: string, decisao: "APROVADA" | "RECUSADA") => {
    setPending(id);
    try {
      decidirSolicitacao(id, decisao);
      toast.success(decisao === "APROVADA" ? "Aprovada" : "Recusada");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setPending(null); }
  };
  const doConcluir = (id: string) => {
    setPending(id);
    try { concluirAdocao(id); toast.success("Adoção concluída!"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setPending(null); }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Solicitações</h1>
      {list.length === 0 ? (
        <div className="mt-6"><EmptyState title="Nenhuma solicitação recebida" /></div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((s) => {
            const a = getAnimal(s.animalId);
            const adot = getAdotante(s.adotanteId);
            const busy = pending === s.id;
            return (
              <li key={s.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {adot?.nomeCompleto ?? "Adotante"} → <Link to="/animais/$animalId" params={{ animalId: s.animalId }} className="hover:underline">{a?.nome ?? "animal"}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground">Enviada em {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}</p>
                    {adot && <p className="mt-1 text-xs text-muted-foreground">Cidade: {adot.cidade} · Moradia: {adot.tipoMoradia ?? "—"}</p>}
                  </div>
                  <StatusSolicitacaoBadge status={s.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/dashboard/solicitacoes/$solicitacaoId" params={{ solicitacaoId: s.id }}>
                      Revisar triagem
                    </Link>
                  </Button>
                  {s.status === "EM_ANALISE" && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => doDecidir(s.id, "APROVADA")}>{busy ? "..." : "Aprovar"}</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => doDecidir(s.id, "RECUSADA")}>{busy ? "..." : "Recusar"}</Button>
                    </>
                  )}
                  {s.status === "APROVADA" && (
                    <Button size="sm" disabled={busy} onClick={() => doConcluir(s.id)}>{busy ? "..." : "Concluir adoção"}</Button>
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
