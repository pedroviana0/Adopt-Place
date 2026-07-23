import { TipoDocumentoSaude } from "@prisma/client";
import Link from "next/link";

import { HealthDocumentList } from "@/components/app/saude/health-document-list";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { getHealthDocuments } from "@/lib/queries/documentos-saude";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";

export default async function DocumentosSaudePage({
  searchParams,
}: {
  searchParams: Promise<{ animalId?: string; tipo?: string }>;
}) {
  const session = await requireResponsible();
  const params = await searchParams;
  const responsibleId =
    session.user.tipoPerfil === "ORGANIZACAO"
      ? session.user.organizacaoId!
      : session.user.acolhedorId!;
  const documentType = Object.values(TipoDocumentoSaude).includes(
    params.tipo as TipoDocumentoSaude,
  )
    ? (params.tipo as TipoDocumentoSaude)
    : undefined;

  const [documents, animals] = await Promise.all([
    getHealthDocuments({ animalId: params.animalId, tipo: documentType }),
    getOwnedAnimals(
      responsibleId,
      session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR",
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documentos de saude</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Arquivos internos vinculados aos seus animais.
          </p>
        </div>
        <Link className="text-sm font-medium underline-offset-4 hover:underline" href="/dashboard/saude">
          Voltar para visao geral
        </Link>
      </div>
      <HealthDocumentList
        documents={documents}
        animals={animals.map((animal) => ({ id: animal.id, nome: animal.nome }))}
        defaultAnimalId={params.animalId}
      />
    </div>
  );
}
