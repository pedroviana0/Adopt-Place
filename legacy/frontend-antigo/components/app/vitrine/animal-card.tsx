import Link from "next/link";

import { Badge, Card, CardContent } from "@/components/ui";
import { getAnimalTags } from "@/lib/tags";
import type { RelatedPublicAnimal } from "@/lib/queries/public-animal";

type AnimalCardProps = {
  animal: RelatedPublicAnimal;
  showRequestHint?: boolean;
};

function responsibleLabel(animal: AnimalCardProps["animal"]) {
  if (animal.organizacao) {
    return `${animal.organizacao.razaoSocial} - ${animal.organizacao.cidade}`;
  }

  if (animal.acolhedor) {
    return `${animal.acolhedor.nomeCompleto} - ${animal.acolhedor.cidade}`;
  }

  return "Responsavel nao informado";
}

export function AnimalCard({ animal, showRequestHint = false }: AnimalCardProps) {
  const photoUrl = animal.fotos[0]?.urlFoto;
  const tags = getAnimalTags(animal);

  return (
    <Card className="overflow-hidden">
      <Link href={`/animais/${animal.id}`} className="block" aria-label={`Ver detalhes de ${animal.nome}`}>
        <div className="aspect-[4/3] bg-[var(--muted)]">
          {photoUrl ? (
            <img src={photoUrl} alt={`Foto de ${animal.nome}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]" aria-hidden="true">
              Sem foto
            </div>
          )}
        </div>
        <CardContent className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{animal.nome}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {animal.especie.nome}
              {animal.raca ? `, ${animal.raca.nome}` : ""} {animal.idadeEstimada ? `- ${animal.idadeEstimada}` : ""}
            </p>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{responsibleLabel(animal)}</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {tags.map((tag) => (
              <Badge key={tag.key} variant="outline">
                {tag.label}
              </Badge>
            ))}
          </div>
          {showRequestHint && animal.status !== "DISPONIVEL" ? (
            <p className="text-sm text-[var(--muted-foreground)]">Indisponivel para solicitacao</p>
          ) : null}
        </CardContent>
      </Link>
    </Card>
  );
}
