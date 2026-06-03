import Link from "next/link";

import { Alert } from "@/components/ui";
import type { getShowcaseAnimals } from "@/lib/queries/animal-showcase";
import type { ShowcaseFilters } from "@/lib/schemas/showcase";
import { AnimalCard } from "./animal-card";

type ShowcaseProps = Awaited<ReturnType<typeof getShowcaseAnimals>> & {
  filters: ShowcaseFilters;
};

function pageHref(filters: ShowcaseFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.especieId) params.set("especieId", filters.especieId);
  if (filters.racaId) params.set("racaId", filters.racaId);
  if (filters.porte) params.set("porte", filters.porte);
  if (filters.sexo) params.set("sexo", filters.sexo);
  if (filters.cidade) params.set("cidade", filters.cidade);
  filters.tags.forEach((tag) => params.append("tags", tag));
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

const linkButtonClass =
  "inline-flex h-10 items-center justify-center rounded-md border bg-transparent px-4 text-sm font-medium transition hover:bg-[var(--muted)]";

export function Showcase({ animals, pagination, filters }: ShowcaseProps) {
  if (animals.length === 0) {
    return (
      <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>Nenhum animal encontrado com esses filtros.</span>
        <Link href="/" className={linkButtonClass}>
          Limpar filtros
        </Link>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>
      {pagination.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginacao da vitrine">
          {pagination.page > 1 ? (
            <Link href={pageHref(filters, pagination.page - 1)} className={linkButtonClass}>
              Anterior
            </Link>
          ) : (
            <span className={`${linkButtonClass} pointer-events-none opacity-50`}>Anterior</span>
          )}
          <span className="text-sm text-[var(--muted-foreground)]">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages ? (
            <Link href={pageHref(filters, pagination.page + 1)} className={linkButtonClass}>
              Proxima
            </Link>
          ) : (
            <span className={`${linkButtonClass} pointer-events-none opacity-50`}>Proxima</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
