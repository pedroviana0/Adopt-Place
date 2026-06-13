import { notFound } from "next/navigation";

import { TriagemForm } from "@/components/app/auth/triagem-form";
import { Badge, Card, CardContent, CardHeader } from "@/components/ui";
import { requireAdopter } from "@/lib/actions/auth-guards";
import { getAdopterDashboard } from "@/lib/queries/adotante-dashboard";

export default async function DashboardTriagemPage() {
  const session = await requireAdopter();
  const adotanteId = session.user.adotanteId;

  if (!adotanteId) {
    notFound();
  }

  const adopter = await getAdopterDashboard(adotanteId);

  if (!adopter) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Triagem de adotante</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Respostas padronizadas usadas na analise de solicitacoes.
          </p>
        </div>
        <Badge variant={adopter.triagemConcluida ? "default" : "secondary"}>
          {adopter.triagemConcluida ? "Triagem concluida" : "Triagem pendente"}
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{adopter.nomeCompleto}</h2>
        </CardHeader>
        <CardContent>
          <TriagemForm adopter={adopter} />
        </CardContent>
      </Card>
    </div>
  );
}
