import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { Animal } from "@/lib/domain/types";
import { fotoPrincipal } from "@/lib/data/animais";
import { listRegistros } from "@/lib/data/saude";
import { computeTags } from "@/lib/domain/tags";
import { TagBadge } from "./TagBadge";
import { getAcolhedor, getOrganizacao } from "@/lib/data/usuarios";

export function AnimalCard({ animal }: { animal: Animal }) {
  const foto = fotoPrincipal(animal.id);
  const tags = computeTags(animal, listRegistros(animal.id)).slice(0, 5);
  const responsavel = animal.organizacaoId
    ? getOrganizacao(animal.organizacaoId)?.razaoSocial
    : animal.acolhedorId
      ? "Acolhedor: " + (getAcolhedor(animal.acolhedorId)?.nomeCompleto ?? "")
      : "";

  return (
    <Link to="/animais/$animalId" params={{ animalId: animal.id }}>
      <Card className="group h-full overflow-hidden py-0 transition hover:border-primary hover:shadow-md">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {foto && (
            <img
              src={foto.urlFoto}
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
          {responsavel && (
            <p className="text-xs text-muted-foreground">{responsavel}</p>
          )}
          {animal.descricao && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{animal.descricao}</p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((t, i) => (
              <TagBadge key={i} tag={t} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
