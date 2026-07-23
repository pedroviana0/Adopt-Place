import { createFileRoute, Link } from "@tanstack/react-router";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listSolicitacoesPorAdotante } from "@/lib/data/solicitacoes";
import { getAnimal } from "@/lib/data/animais";
import { StatusSolicitacaoBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/minhas-solicitacoes")({
  head: () => ({ meta: [{ title: "Minhas solicitações — AdoptPlace" }, { name: "description", content: "Acompanhe suas solicitações de adoção." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  const list = s?.adotanteId ? listSolicitacoesPorAdotante(s.adotanteId) : [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Minhas solicitações</h1>
      {list.length === 0 ? (
        <div className="mt-6"><EmptyState title="Você ainda não fez nenhuma solicitação" action={{ label: "Ver vitrine", to: "/vitrine" }} /></div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((s) => {
            const a = getAnimal(s.animalId);
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Link to="/animais/$animalId" params={{ animalId: s.animalId }} className="font-medium hover:underline">{a?.nome ?? "Animal"}</Link>
                  <p className="text-xs text-muted-foreground">Enviada em {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}</p>
                  {s.observacoes && <p className="mt-1 text-xs text-muted-foreground">{s.observacoes}</p>}
                </div>
                <StatusSolicitacaoBadge status={s.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
