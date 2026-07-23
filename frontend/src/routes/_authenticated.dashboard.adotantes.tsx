import { createFileRoute } from "@tanstack/react-router";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listSolicitacoesPorResponsavel } from "@/lib/data/solicitacoes";
import { getAnimal } from "@/lib/data/animais";
import { getAdotante } from "@/lib/data/usuarios";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/dashboard/adotantes")({
  component: Page,
});

function Page() {
  useDbVersion();
  const s = useSessao();
  if (!s) return null;
  const concluidas = listSolicitacoesPorResponsavel({ organizacaoId: s.organizacaoId, acolhedorId: s.acolhedorId }).filter((x) => x.status === "CONCLUIDA");
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Adotantes</h1>
      <p className="text-sm text-muted-foreground">Adoções concluídas dos seus animais.</p>
      {concluidas.length === 0 ? (
        <div className="mt-6"><EmptyState title="Nenhuma adoção concluída ainda" /></div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-card text-sm">
          {concluidas.map((s) => {
            const a = getAnimal(s.animalId);
            const adot = getAdotante(s.adotanteId);
            return (
              <li key={s.id} className="flex justify-between p-4">
                <div>
                  <p className="font-medium">{adot?.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground">Adotou {a?.nome} · {new Date(s.dataAtualizacao).toLocaleDateString("pt-BR")}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
