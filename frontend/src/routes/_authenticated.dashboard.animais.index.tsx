import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil } from "lucide-react";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { fotoPrincipal, listAnimais } from "@/lib/data/animais";
import { StatusBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/animais/")({
  head: () => ({ meta: [{ title: "Meus animais — AdoptPlace" }, { name: "description", content: "Gerencie os animais sob seus cuidados." }] }),
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  if (!s) return null;
  const list = listAnimais({ ownerId: { organizacaoId: s.organizacaoId, acolhedorId: s.acolhedorId } });
  const canCreate = s.tipoPerfil === "ORGANIZACAO" || s.tipoPerfil === "ACOLHEDOR";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">Meus animais</h1>
        {canCreate && (
          <Button asChild size="sm">
            <Link to="/dashboard/animais/novo"><Plus className="mr-1 h-4 w-4" /> Novo animal</Link>
          </Button>
        )}
      </div>
      {list.length === 0 ? (
        <div className="mt-6"><EmptyState title="Nenhum animal cadastrado" description="Cadastre animais para começar a receber solicitações." /></div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card">
          {list.map((a) => {
            const foto = fotoPrincipal(a.id);
            return (
              <li key={a.id} className="flex items-center gap-4 p-3">
                {foto && <img src={foto.urlFoto} alt="" className="h-14 w-14 rounded-md object-cover" />}
                <div className="flex-1">
                  <Link to="/animais/$animalId" params={{ animalId: a.id }} className="font-medium hover:underline">{a.nome}</Link>
                  <p className="text-xs text-muted-foreground">{a.cor} · {a.idadeEstimada ?? "—"}</p>
                </div>
                <StatusBadge status={a.status} />
                <Button asChild size="sm" variant="ghost" aria-label={`Editar ${a.nome}`}>
                  <Link to="/dashboard/animais/$animalId" params={{ animalId: a.id }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
