import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicAnimalGallery } from "@/components/app/animais/public-animal-gallery";
import { PublicHealthSummary } from "@/components/app/animais/public-health-summary";
import { ProtectedActionButtons } from "@/components/app/animais/protected-action-buttons";
import { RelatedAnimals } from "@/components/app/animais/related-animals";
import { Badge } from "@/components/ui";
import { getPublicAnimal } from "@/lib/queries/public-animal";
import { getAnimalTags } from "@/lib/tags";

type PublicAnimalPageProps = {
  params: Promise<{ id: string }>;
};

function responsibleLabel(animal: NonNullable<Awaited<ReturnType<typeof getPublicAnimal>>>) {
  if (animal.organizacao) {
    return `${animal.organizacao.razaoSocial} - ${animal.organizacao.cidade}`;
  }

  if (animal.acolhedor) {
    return `${animal.acolhedor.nomeCompleto} - ${animal.acolhedor.cidade}`;
  }

  return "Responsavel nao informado";
}

export async function generateMetadata({ params }: PublicAnimalPageProps): Promise<Metadata> {
  const { id } = await params;
  const animal = await getPublicAnimal(id);

  return {
    title: animal ? animal.nome : "Animal nao encontrado",
  };
}

export default async function PublicAnimalPage({ params }: PublicAnimalPageProps) {
  const { id } = await params;
  const animal = await getPublicAnimal(id);

  if (!animal) {
    notFound();
  }

  const tags = getAnimalTags(animal);
  const relatedAnimals = animal.relacionadosA.map((relation) => relation.animalRelacionado);
  const available = animal.status === "DISPONIVEL";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,560px)_1fr]">
        <PublicAnimalGallery animalName={animal.nome} photos={animal.fotos} />
        <div className="space-y-5">
          <div>
            <Badge variant={available ? "default" : "secondary"}>
              {available ? "Disponivel para adocao" : "Indisponivel no momento"}
            </Badge>
            <h1 className="mt-3 text-4xl font-bold">{animal.nome}</h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              {animal.especie.nome}
              {animal.raca ? `, ${animal.raca.nome}` : ""} {animal.idadeEstimada ? `- ${animal.idadeEstimada}` : ""}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border bg-white p-4">
              <dt className="text-sm text-[var(--muted-foreground)]">Cor</dt>
              <dd className="font-medium">{animal.cor}</dd>
            </div>
            <div className="rounded-md border bg-white p-4">
              <dt className="text-sm text-[var(--muted-foreground)]">Responsavel</dt>
              <dd className="font-medium">{responsibleLabel(animal)}</dd>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag.key} variant="outline">
                {tag.label}
              </Badge>
            ))}
          </div>
          {animal.descricao ? <p className="leading-7 text-[var(--muted-foreground)]">{animal.descricao}</p> : null}
          <ProtectedActionButtons animalId={animal.id} available={available} />
        </div>
      </section>

      <PublicHealthSummary records={animal.registrosSaude} />
      <RelatedAnimals animals={relatedAnimals} />
    </div>
  );
}
