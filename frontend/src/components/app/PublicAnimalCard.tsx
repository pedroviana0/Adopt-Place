import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicAnimalSummary } from "@/lib/data/animais";

// Public showcase card (Issue #27): renders straight from the real public DTO
// returned by GET /api/animais. Kept separate from the mock-backed `AnimalCard`
// (which the still-mock favorites/owner flows use) to avoid coupling changes.
export function PublicAnimalCard({ animal }: { animal: PublicAnimalSummary }) {
  return (
    <Link to="/animais/$animalId" params={{ animalId: animal.id }}>
      <Card className="group h-full overflow-hidden py-0 transition hover:border-primary hover:shadow-md">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {animal.fotoPrincipal && (
            <img
              src={animal.fotoPrincipal}
              alt={animal.nome}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold">{animal.nome}</h3>
            {animal.idadeEstimada && (
              <span className="text-xs text-muted-foreground">{animal.idadeEstimada}</span>
            )}
          </div>
          {animal.responsavel && (
            <p className="text-xs text-muted-foreground">{animal.responsavel}</p>
          )}
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
    </Link>
  );
}
