import { notFound } from "next/navigation";

import { HealthRecordPanel } from "@/components/app/saude/health-record-panel";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { prisma } from "@/lib/prisma";

export default async function AnimalSaudePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireResponsible();

  const responsavelId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  const { id: animalId } = await params;

  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: {
      id: true,
      nome: true,
      organizacaoId: true,
      acolhedorId: true,
      registrosSaude: {
        orderBy: { dataRegistro: "desc" },
        select: {
          id: true,
          tipo: true,
          dataRegistro: true,
          dataProxima: true,
          resultado: true,
          nomeVacina: true,
          tipoMedicamento: true,
          frequencia: true,
          ehVacinaCustomizada: true,
          nomeDoenca: true,
          ehDoencaCustomizada: true,
        },
      },
    },
  });

  if (!animal) {
    notFound();
  }

  const isOwner =
    (session.user.tipoPerfil === "ORGANIZACAO" && animal.organizacaoId === responsavelId) ||
    (session.user.tipoPerfil === "ACOLHEDOR" && animal.acolhedorId === responsavelId);

  if (!isOwner) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Saude: {animal.nome}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Registros de vacinas, parasitas e testes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Registros de Saude</h2>
        </CardHeader>
        <CardContent>
          <HealthRecordPanel
            records={animal.registrosSaude.map((r) => ({
              id: r.id,
              tipo: r.tipo,
              dataAplicacao: r.dataRegistro,
              dataProximaDose: r.dataProxima,
              resultado: r.resultado,
              nomeCustom: r.nomeVacina,
              tipoMedicacao: r.tipoMedicamento,
              frequencia: r.frequencia,
              vacinaId: r.ehVacinaCustomizada ? r.id : null,
            }))}
            animalId={animalId}
            canEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
