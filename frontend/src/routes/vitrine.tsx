import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { AnimalFilters, emptyFilters, type FilterState } from "@/components/app/AnimalFilters";
import { EmptyState } from "@/components/app/EmptyState";
import { fetchVitrine } from "@/lib/data/animais";
import { fetchCatalogos } from "@/lib/data/catalogos";

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine de adoção — AdoptPlace" },
      {
        name: "description",
        content: "Todos os animais disponíveis para adoção agora em Volta Redonda/RJ.",
      },
      { property: "og:title", content: "Vitrine de adoção — AdoptPlace" },
      {
        property: "og:description",
        content: "Encontre seu parceiro ideal na vitrine pública do AdoptPlace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VitrinePage,
});

function VitrinePage() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [page, setPage] = useState(1);

  const catalogos = useQuery({ queryKey: ["catalogos"], queryFn: fetchCatalogos });
  const vitrine = useQuery({
    queryKey: ["vitrine", filters, page],
    queryFn: () => fetchVitrine({ ...filters, page }),
  });

  const items = vitrine.data?.animals ?? [];
  const pagination = vitrine.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Vitrine de adoção</h1>
      <p className="mt-1 text-sm text-muted-foreground">Animais disponíveis para adoção</p>
      <div className="mt-6">
        <AnimalFilters
          value={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1);
          }}
          especies={catalogos.data?.especies}
        />
      </div>

      {vitrine.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando animais…</p>
      ) : vitrine.isError ? (
        <div className="mt-8">
          <EmptyState
            title="Não foi possível carregar a vitrine"
            action={{ label: "Tentar novamente", onClick: () => vitrine.refetch() }}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum animal encontrado com esses critérios"
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setFilters(emptyFilters());
                setPage(1);
              },
            }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((a) => (
              <PublicAnimalCard key={a.id} animal={a} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
