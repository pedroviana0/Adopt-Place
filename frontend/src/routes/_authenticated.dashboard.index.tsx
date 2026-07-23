import { createFileRoute } from "@tanstack/react-router";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { listAnimais } from "@/lib/data/animais";
import { listSolicitacoesPorResponsavel } from "@/lib/data/solicitacoes";
import { alertasProximos } from "@/lib/data/saude";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashIndex,
});

function DashIndex() {
  useDbVersion();
  const s = useSessao();
  if (!s) return null;
  const owner = { organizacaoId: s.organizacaoId, acolhedorId: s.acolhedorId };
  const meus = listAnimais({ ownerId: owner });
  const sol = listSolicitacoesPorResponsavel(owner);
  const emAnalise = sol.filter((x) => x.status === "EM_ANALISE").length;
  const alertas = alertasProximos(meus.map((a) => a.id), 30);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Painel</h1>
      <p className="text-sm text-muted-foreground">Olá, {s.nome}!</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Meus animais" value={meus.length} />
        <Metric label="Disponíveis" value={meus.filter((a) => a.status === "DISPONIVEL").length} />
        <Metric label="Solicitações em análise" value={emAnalise} />
      </div>
      {alertas.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Alertas dos próximos 30 dias</h2>
          <ul className="mt-3 divide-y rounded-xl border bg-card text-sm">
            {alertas.map(({ registro, diasRestantes }) => (
              <li key={registro.id} className="flex justify-between p-3">
                <span>{registro.tipo === "VACINA" ? registro.nomeVacina : registro.tipoMedicamento} — animal #{registro.animalId}</span>
                <span className="text-muted-foreground">em {diasRestantes} dia(s)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-serif text-3xl font-semibold">{value}</p></CardContent></Card>;
}
