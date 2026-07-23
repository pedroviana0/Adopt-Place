import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimalCard } from "@/components/app/AnimalCard";
import { AnimalFilters, emptyFilters, type FilterState } from "@/components/app/AnimalFilters";
import { EmptyState } from "@/components/app/EmptyState";
import { listAnimais } from "@/lib/data/animais";
import { useDbVersion } from "@/lib/data/hooks";

export const Route = createFileRoute("/vitrine")({
  head: () => ({
    meta: [
      { title: "Vitrine de adoção — AdoptPlace" },
      { name: "description", content: "Todos os animais disponíveis para adoção agora em Volta Redonda/RJ." },
      { property: "og:title", content: "Vitrine de adoção — AdoptPlace" },
      { property: "og:description", content: "Encontre seu parceiro ideal na vitrine pública do AdoptPlace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VitrinePage,
});

const PAGE = 12;

function VitrinePage() {
  useDbVersion();
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [page, setPage] = useState(1);
  const results = useMemo(() => listAnimais({ ...filters, status: "DISPONIVEL" }), [filters]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE));
  const items = results.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Vitrine de adoção</h1>
      <p className="mt-1 text-sm text-muted-foreground">Animais disponíveis para adoção</p>
      <div className="mt-6">
        <AnimalFilters value={filters} onChange={(v) => { setFilters(v); setPage(1); }} />
      </div>
      {results.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nenhum animal encontrado com esses critérios"
            action={{ label: "Limpar filtros", onClick: () => setFilters(emptyFilters()) }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((a) => <AnimalCard key={a.id} animal={a} />)}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
