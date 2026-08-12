import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, PawPrint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicAnimalSummary } from "@/lib/data/animais";

export function AnimalImagePlaceholder({
  animalName,
  failed = false,
  className = "h-full w-full",
}: {
  animalName: string;
  failed?: boolean;
  className?: string;
}) {
  const Icon = failed ? ImageOff : PawPrint;
  const label = failed ? `Foto de ${animalName} indisponível` : `${animalName} está sem foto`;

  return (
    <div
      role="img"
      aria-label={label}
      className={`${className} grid place-items-center bg-surface-subtle px-4 text-center text-muted-foreground`}
    >
      <div>
        <Icon className="mx-auto h-8 w-8" aria-hidden="true" />
        <p className="mt-2 text-xs font-medium">{failed ? "Foto indisponível" : "Sem foto"}</p>
      </div>
    </div>
  );
}

export function PublicAnimalCard({ animal }: { animal: PublicAnimalSummary }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="group h-full rounded-xl">
      <Card className="h-full overflow-hidden py-0 transition-colors group-hover:border-primary group-focus-visible:border-primary">
        <Link
          to="/animais/$animalId"
          params={{ animalId: animal.id }}
          className="block aspect-square w-full overflow-hidden bg-muted"
          aria-label={`Conhecer ${animal.nome}`}
        >
          {animal.fotoPrincipal && !imageFailed ? (
            <img
              src={animal.fotoPrincipal}
              alt={`Foto de ${animal.nome}`}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <AnimalImagePlaceholder animalName={animal.nome} failed={imageFailed} />
          )}
        </Link>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 break-words font-serif text-lg font-semibold">
              <Link to="/animais/$animalId" params={{ animalId: animal.id }}>
                {animal.nome}
              </Link>
            </h3>
            {animal.idadeEstimada && (
              <span className="shrink-0 text-xs text-muted-foreground">{animal.idadeEstimada}</span>
            )}
          </div>
          {animal.responsavel && animal.responsavelId && animal.responsavelTipo ? (
            <a
              className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              href={
                animal.responsavelTipo === "ORGANIZACAO"
                  ? `/organizacoes/${animal.responsavelId}`
                  : `/acolhedores/${animal.responsavelId}`
              }
            >
              {animal.responsavel}
            </a>
          ) : animal.responsavel ? (
            <p className="text-xs text-muted-foreground">{animal.responsavel}</p>
          ) : null}
          {animal.cidade && <p className="text-xs text-muted-foreground">{animal.cidade}</p>}
          <div className="flex flex-wrap gap-1 pt-1">
            {animal.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.key}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
