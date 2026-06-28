import { notFound } from "next/navigation";

import { AnimalManagementList } from "@/components/app/animais/animal-management-list"
import { AnimalForm as AnimalCreateForm } from "@/components/app/animais/animal-form";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireResponsible } from "@/lib/actions/auth-guards";
import { createAnimal } from "@/lib/actions/animais";
import { getOwnedAnimals } from "@/lib/queries/owned-animals";
import { prisma } from "@/lib/prisma";

export default async function AnimaisPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const session = await requireResponsible();

  const responsavelId =
    (session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR") === "ORGANIZACAO"
      ? session.user.organizacaoId
      : session.user.acolhedorId;

  if (!responsavelId) {
    notFound();
  }

  const { modo } = await searchParams;
  const isCreating = modo === "criar";

  const animals = await getOwnedAnimals(responsavelId, session.user.tipoPerfil as "ORGANIZACAO" | "ACOLHEDOR");

  const [speciesList, racasList] = await Promise.all([
    prisma.especie.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.raca.findMany({ select: { id: true, nome: true, especieId: true }, orderBy: { nome: "asc" } }),
  ]);

  const ownerField = {
    organizacaoId: session.user.organizacaoId,
    acolhedorId: session.user.acolhedorId,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meus Animais</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Gerencie os animais cadastrados.
          </p>
        </div>
        {isCreating ? (
          <a href="/dashboard/animais">Voltar para lista</a>
        ) : (
          <a href="/dashboard/animais?modo=criar" className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]">
            Novo Animal
          </a>
        )}
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Novo Animal</h2>
          </CardHeader>
          <CardContent>
            <AnimalCreateForm
              onSubmit={createAnimal}
              speciesList={speciesList}
              racasList={racasList}
              ownerField={ownerField}
            />
          </CardContent>
        </Card>
      ) : (
        <AnimalManagementList animals={animals} />
      )}
    </div>
  );
}
