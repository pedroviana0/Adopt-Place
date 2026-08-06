import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/ui/gradient-background";
import { PublicAnimalCard } from "@/components/app/PublicAnimalCard";
import { AnimalFilters, emptyFilters, type FilterState } from "@/components/app/AnimalFilters";
import { EmptyState } from "@/components/app/EmptyState";
import { useState } from "react";
import { fetchVitrine, fetchPublicMetrics } from "@/lib/data/animais";
import { fetchCatalogos } from "@/lib/data/catalogos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdoptPlace — Encontre seu parceiro ideal" },
      {
        name: "description",
        content:
          "Conectamos animais resgatados a famílias prontas para adotar em Volta Redonda/RJ.",
      },
      { property: "og:title", content: "AdoptPlace — Encontre seu parceiro ideal" },
      {
        property: "og:description",
        content:
          "Adote com responsabilidade: animais resgatados por organizações e acolhedores de Volta Redonda/RJ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [page, setPage] = useState(1);

  const catalogos = useQuery({ queryKey: ["catalogos"], queryFn: fetchCatalogos });
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: fetchPublicMetrics });
  const vitrine = useQuery({
    queryKey: ["vitrine", filters, page],
    queryFn: () => fetchVitrine({ ...filters, page }),
  });

  const paginados = vitrine.data?.animals ?? [];
  const pagination = vitrine.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalDisponiveis = pagination?.total ?? 0;

  const metrics = {
    disponiveis: metricsQuery.data?.availableAnimals ?? 0,
    adotados: metricsQuery.data?.completedAdoptions ?? 0,
    parceiros: metricsQuery.data?.responsibleParties ?? 0,
  };

  return (
    <div>
      {/* Hero — fundo Jade Sky */}
      <section className="relative border-b border-primary/10">
        <GradientBackground className="absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Volta Redonda/RJ · Adoção responsável
            </span>
            <h1
              className="mt-5 font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
              style={{ color: "oklch(0.30 0.06 156)" }}
            >
              Encontre seu <span className="text-accent">companheiro</span> ideal
            </h1>
            <p className="mt-5 max-w-xl text-lg text-foreground/80">
              O AdoptPlace conecta animais resgatados por organizações e acolhedores independentes a
              famílias prontas para dar um lar cheio de amor.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#vitrine">
                  Ver animais disponíveis <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/60 backdrop-blur-sm">
                <Link to="/cadastro/organizacao">Sou uma organização</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              <Stat value={metrics.disponiveis} label="Animais disponíveis" />
              <Stat value={metrics.adotados} label="Adoções realizadas" />
              <Stat value={metrics.parceiros} label="Acolhedores parceiros" />
            </div>
          </div>
        </div>
      </section>

      {/* Vitrine */}
      <section id="vitrine" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Animais disponíveis</h2>
            <p className="text-sm text-muted-foreground">
              {totalDisponiveis} {totalDisponiveis === 1 ? "animal" : "animais"} para conhecer
            </p>
          </div>
        </div>

        <AnimalFilters
          value={filters}
          onChange={(v) => {
            setFilters(v);
            setPage(1);
          }}
          especies={catalogos.data?.especies}
        />

        {vitrine.isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Carregando animais…</p>
        ) : vitrine.isError ? (
          <div className="mt-8">
            <EmptyState
              title="Não foi possível carregar os animais"
              action={{ label: "Tentar novamente", onClick: () => vitrine.refetch() }}
            />
          </div>
        ) : paginados.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Nenhum animal encontrado com esses critérios"
              description="Ajuste os filtros para explorar outros perfis disponíveis."
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
              {paginados.map((a) => (
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
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-serif text-4xl font-bold leading-none text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-sm text-foreground/70">{label}</p>
    </div>
  );
}
