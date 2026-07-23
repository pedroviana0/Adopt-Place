import type { TipoRegistroSaude } from "@prisma/client";
import { notFound } from "next/navigation";

import { HealthAgendaList } from "@/components/app/saude/health-agenda-list";
import { HealthDocumentList } from "@/components/app/saude/health-document-list";
import { HealthHistoryTimeline } from "@/components/app/saude/health-history-timeline";
import { HealthRecordPanel } from "@/components/app/saude/health-record-panel";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getHealthDocuments } from "@/lib/queries/documentos-saude";
import {
  getAnimalHealthTimeline,
  getHealthAgenda,
} from "@/lib/queries/health-dashboard";
import { prisma } from "@/lib/prisma";

export default async function AnimalSaudePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ completeCare?: string }>;
}) {
  const session = await requireResponsible();
  const { id: animalId } = await params;
  const { completeCare } = await searchParams;
  const ownerWhere =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? { organizacaoId: session.user.organizacaoId! }
      : { acolhedorId: session.user.acolhedorId! };
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, ...ownerWhere },
    select: { id: true, nome: true },
  });

  if (!animal) notFound();

  const [timeline, agenda, documents] = await Promise.all([
    getAnimalHealthTimeline(animalId),
    getHealthAgenda({ animalId }),
    getHealthDocuments({ animalId }),
  ]);
  const plannedCare = agenda.find(
    (item) => item.id === completeCare && item.status === "PENDENTE" && item.tipo !== "CONSULTA",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Saude: {animal.nome}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Historico realizado, agenda e documentos internos.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold">Registrar cuidado</h2>
        <HealthRecordPanel
          records={timeline.map((record) => ({
            id: record.id,
            tipo: record.tipo,
            dataAplicacao: record.dataRegistro,
            dataProximaDose: record.dataProxima,
            resultado: record.resultado,
            nomeCustom: record.nomeVacina ?? record.nomeDoenca ?? record.titulo,
            tipoMedicacao: record.tipoMedicamento,
            frequencia: record.frequencia,
            vacinaId: record.ehVacinaCustomizada ? record.id : null,
          }))}
          animalId={animalId}
          canEdit
          plannedCareId={plannedCare?.id}
          initialType={plannedCare?.tipo as TipoRegistroSaude | undefined}
        />
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold">Historico</h2>
        <HealthHistoryTimeline records={timeline} />
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold">Agenda deste animal</h2>
        <HealthAgendaList
          items={agenda}
          filters={{ animalId }}
          animals={[{ id: animal.id, nome: animal.nome }]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold">Documentos internos</h2>
        <HealthDocumentList
          documents={documents}
          animals={[{ id: animal.id, nome: animal.nome }]}
          defaultAnimalId={animalId}
        />
      </section>
    </div>
  );
}
